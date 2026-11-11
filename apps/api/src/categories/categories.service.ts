import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import {
  OPTIONS_ALLOWED,
  type Category,
  type CategoryWithAttributes,
  type CategoryAttributeInputDto,
  type CreateCategoryDto,
  type UpdateCategoryDto,
} from '@app/contracts';
import { DRIZZLE } from '../db/db.module';
import type { Database, Transaction } from '../db/types';
import {
  categories,
  categoryAttributeOptions,
  categoryAttributes,
  type CategoryAttribute as CategoryAttributeRow,
  type CategoryAttributeOption as CategoryAttributeOptionRow,
} from 'src/db/schema';
import { isForeignKeyViolation, isUniqueViolation } from 'src/db/errors';
import { generateSlug } from '../common/slugify';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getAllCategories(): Promise<Category[]> {
    return await this.db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
      })
      .from(categories);
  }

  async getCategory(id: number): Promise<CategoryWithAttributes | null> {
    const category = await this.db.query.categories.findFirst({
      columns: { id: true, name: true, slug: true, parentId: true },
      where: eq(categories.id, id),
      with: {
        attributes: {
          columns: {
            id: true,
            categoryId: true,
            key: true,
            label: true,
            type: true,
            multiple: true,
            unit: true,
            required: true,
            filterable: true,
          },
          orderBy: asc(categoryAttributes.id),
          with: {
            options: {
              columns: {
                id: true,
                attributeId: true,
                value: true,
                label: true,
                sortOrder: true,
              },
              orderBy: asc(categoryAttributeOptions.sortOrder),
            },
          },
        },
      },
    });

    return category ?? null;
  }

  async createCategory(
    dto: CreateCategoryDto,
  ): Promise<CategoryWithAttributes> {
    this.validateAttributes(dto.attributes);

    return this.db.transaction(async (tx) => {
      const category = await this.insertCategory(tx, dto);

      const attributes = await this.insertAttributes(
        tx,
        category.id,
        dto.attributes,
      );

      const options = await this.insertAttributeOptions(
        tx,
        attributes,
        dto.attributes,
      );

      return this.buildCategoryResponse(category, attributes, options);
    });
  }

  async updateCategory(
    id: number,
    dto: UpdateCategoryDto,
  ): Promise<CategoryWithAttributes> {
    this.validateAttributes(dto.attributes);

    return await this.db.transaction(async (tx) => {
      const category = await this.updateCategoryRow(tx, id, dto);

      const existingAttributes = await tx
        .select()
        .from(categoryAttributes)
        .where(eq(categoryAttributes.categoryId, category.id));

      const existingKeys = new Set(existingAttributes.map(({ key }) => key));
      const incomingKeys = new Set(
        dto.attributes.map(({ label }) => generateSlug(label)),
      );

      const removedAttributes = existingAttributes.filter(
        ({ key }) => !incomingKeys.has(key),
      );
      const keptAttributes = dto.attributes.filter((attr) =>
        existingKeys.has(generateSlug(attr.label)),
      );
      const newAttributes = dto.attributes.filter(
        (attr) => !existingKeys.has(generateSlug(attr.label)),
      );

      await this.deleteCategoryAttributes(tx, removedAttributes);
      const updatedAttributes = await this.updateCategoryAttributes(
        tx,
        category.id,
        keptAttributes,
      );
      const insertedAttributes = await this.insertAttributes(
        tx,
        category.id,
        newAttributes,
      );

      const updatedOptions = await this.updateAttributeOptions(
        tx,
        updatedAttributes,
        keptAttributes,
      );
      const insertedOptions = await this.insertAttributeOptions(
        tx,
        insertedAttributes,
        newAttributes,
      );

      return this.buildCategoryResponse(
        category,
        [...updatedAttributes, ...insertedAttributes],
        [...updatedOptions, ...insertedOptions],
      );
    });
  }

  async deleteCategory(id: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      const attributes = await tx
        .select()
        .from(categoryAttributes)
        .where(eq(categoryAttributes.categoryId, id));

      await this.deleteCategoryAttributes(tx, attributes);

      try {
        const [deleted] = await tx
          .delete(categories)
          .where(eq(categories.id, id))
          .returning({ id: categories.id });

        if (!deleted) {
          throw new NotFoundException(`Category ${id} not found`);
        }
      } catch (error) {
        if (isForeignKeyViolation(error, 'lots_category_id_categories_id_fk')) {
          throw new ConflictException(
            'Category is used by lots and cannot be removed',
          );
        }

        if (
          isForeignKeyViolation(error, 'categories_parent_id_categories_id_fk')
        ) {
          throw new ConflictException(
            'Category has subcategories and cannot be removed',
          );
        }

        throw error;
      }
    });
  }

  private async updateCategoryRow(
    tx: Transaction,
    id: number,
    dto: UpdateCategoryDto,
  ) {
    const { name, slug, parentId } = dto;

    const [category] = await tx
      .update(categories)
      .set({ name, slug, parentId })
      .where(eq(categories.id, id))
      .returning();

    return category;
  }

  private async deleteCategoryAttributes(
    tx: Transaction,
    attributes: CategoryAttributeRow[],
  ): Promise<void> {
    if (!attributes.length) return;

    try {
      await tx.delete(categoryAttributes).where(
        inArray(
          categoryAttributes.id,
          attributes.map(({ id }) => id),
        ),
      );
    } catch (error) {
      if (
        isForeignKeyViolation(
          error,
          'lots_attributes_category_attribute_id_category_attributes_id_fk',
        )
      ) {
        throw new ConflictException(
          'Attribute is used by lots and cannot be removed',
        );
      }

      throw error;
    }
  }

  private async updateCategoryAttributes(
    tx: Transaction,
    categoryId: number,
    attributes: CategoryAttributeInputDto[],
  ): Promise<CategoryAttributeRow[]> {
    if (!attributes.length) {
      return [];
    }

    const values = attributes.map(
      ({ label, type, multiple, unit, required, filterable }) =>
        sql`(${generateSlug(label)}::text, ${label}::text, ${type}::text, ${multiple}::boolean, ${unit}::text, ${required}::boolean, ${filterable}::boolean)`,
    );

    try {
      return await tx
        .update(categoryAttributes)
        .set({
          label: sql`v.label`,
          type: sql`v.type`,
          multiple: sql`v.multiple`,
          unit: sql`v.unit`,
          required: sql`v.required`,
          filterable: sql`v.filterable`,
        })
        .from(
          sql`(values ${sql.join(values, sql`, `)}) as v(key, label, type, multiple, unit, required, filterable)`,
        )
        .where(
          and(
            eq(categoryAttributes.categoryId, categoryId),
            sql`${categoryAttributes.key} = v.key`,
          ),
        )
        .returning();
    } catch (error) {
      if (isUniqueViolation(error, 'category_attributes_category_key_uq')) {
        throw new ConflictException('Duplicate attribute key in category');
      }

      throw error;
    }
  }

  private async updateAttributeOptions(
    tx: Transaction,
    updatedAttributes: CategoryAttributeRow[],
    attributes: CategoryAttributeInputDto[],
  ): Promise<CategoryAttributeOptionRow[]> {
    if (!updatedAttributes.length) return [];

    const attributeIdByKey = new Map(
      updatedAttributes.map(({ key, id }) => [key, id]),
    );

    const incoming = attributes.flatMap(({ label: attributeLabel, options }) =>
      options.map(({ value, label, sortOrder }) => ({
        value,
        label,
        sortOrder,
        attributeId: attributeIdByKey.get(generateSlug(attributeLabel))!,
      })),
    );

    const existing = await tx
      .select()
      .from(categoryAttributeOptions)
      .where(
        inArray(
          categoryAttributeOptions.attributeId,
          updatedAttributes.map(({ id }) => id),
        ),
      );

    const identity = (attributeId: number, value: string) =>
      `${attributeId}:${value}`;
    const existingByIdentity = new Map(
      existing.map((option) => [
        identity(option.attributeId, option.value),
        option,
      ]),
    );
    const incomingIdentities = new Set(
      incoming.map(({ attributeId, value }) => identity(attributeId, value)),
    );

    const removed = existing.filter(
      (option) =>
        !incomingIdentities.has(identity(option.attributeId, option.value)),
    );
    const kept = incoming.filter(({ attributeId, value }) =>
      existingByIdentity.has(identity(attributeId, value)),
    );
    const added = incoming.filter(
      ({ attributeId, value }) =>
        !existingByIdentity.has(identity(attributeId, value)),
    );

    if (removed.length) {
      await tx.delete(categoryAttributeOptions).where(
        inArray(
          categoryAttributeOptions.id,
          removed.map(({ id }) => id),
        ),
      );
    }

    try {
      const updated = kept.length
        ? await tx
            .update(categoryAttributeOptions)
            .set({ label: sql`v.label`, sortOrder: sql`v.sort_order` })
            .from(
              sql`(values ${sql.join(
                kept.map(
                  ({ attributeId, value, label, sortOrder }) =>
                    sql`(${attributeId}::integer, ${value}::text, ${label}::text, ${sortOrder}::smallint)`,
                ),
                sql`, `,
              )}) as v(attribute_id, value, label, sort_order)`,
            )
            .where(
              and(
                eq(categoryAttributeOptions.attributeId, sql`v.attribute_id`),
                eq(categoryAttributeOptions.value, sql`v.value`),
              ),
            )
            .returning()
        : [];

      const inserted = added.length
        ? await tx.insert(categoryAttributeOptions).values(added).returning()
        : [];

      return [...updated, ...inserted];
    } catch (error) {
      if (
        isUniqueViolation(
          error,
          'category_attribute_options_attribute_id_value_unique',
        )
      ) {
        throw new ConflictException('Duplicate option value in attribute');
      }

      throw error;
    }
  }

  private checkHasAttributes(attributes: CategoryAttributeInputDto[]): void {
    if (!attributes.length) {
      throw new BadRequestException('The category must have attributes');
    }
  }

  private validateAttributes(attributes: CategoryAttributeInputDto[]): void {
    this.checkHasAttributes(attributes);
    attributes.forEach((attribute) => this.checkAttribute(attribute));
  }

  private async insertCategory(
    tx: Transaction,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    const { name, slug, parentId } = dto;

    try {
      const [category] = await tx
        .insert(categories)
        .values({ name, slug, parentId })
        .returning();

      return category;
    } catch (error) {
      if (isUniqueViolation(error, 'categories_slug_unique')) {
        throw new ConflictException(`Slug "${slug}" is already taken`);
      }

      if (
        isForeignKeyViolation(error, 'categories_parent_id_categories_id_fk')
      ) {
        throw new BadRequestException(`Parent category ${parentId} not found`);
      }

      throw error;
    }
  }

  private async insertAttributes(
    tx: Transaction,
    categoryId: number,
    attributes: CategoryAttributeInputDto[],
  ): Promise<CategoryAttributeRow[]> {
    if (!attributes.length) return [];

    try {
      return await tx
        .insert(categoryAttributes)
        .values(
          attributes.map(
            ({ label, type, multiple, unit, required, filterable }) => ({
              key: generateSlug(label),
              label,
              type,
              multiple,
              unit,
              required,
              filterable,
              categoryId,
            }),
          ),
        )
        .returning();
    } catch (error) {
      if (isUniqueViolation(error, 'category_attributes_category_key_uq')) {
        throw new ConflictException('Duplicate attribute key in category');
      }

      throw error;
    }
  }

  private async insertAttributeOptions(
    tx: Transaction,
    insertedAttributes: CategoryAttributeRow[],
    attributes: CategoryAttributeInputDto[],
  ): Promise<CategoryAttributeOptionRow[]> {
    const attributeIdByKey = new Map(
      insertedAttributes.map(({ key, id }) => [key, id]),
    );

    const rows = attributes.flatMap(({ label: attributeLabel, options }) =>
      options.map(({ value, label, sortOrder }) => ({
        value,
        label,
        sortOrder,
        attributeId: attributeIdByKey.get(generateSlug(attributeLabel))!,
      })),
    );

    if (!rows.length) return [];

    try {
      return await tx.insert(categoryAttributeOptions).values(rows).returning();
    } catch (error) {
      if (
        isUniqueViolation(
          error,
          'category_attribute_options_attribute_id_value_unique',
        )
      ) {
        throw new ConflictException('Duplicate option value in attribute');
      }

      throw error;
    }
  }

  private buildCategoryResponse(
    category: Category,
    attributes: CategoryAttributeRow[],
    options: CategoryAttributeOptionRow[],
  ): CategoryWithAttributes {
    const optionsByAttributeId = Map.groupBy(
      options,
      ({ attributeId }) => attributeId,
    );

    return {
      ...category,
      attributes: attributes.map((attribute) => ({
        ...attribute,
        options: optionsByAttributeId.get(attribute.id) ?? [],
      })),
    };
  }

  private checkAttribute({
    label,
    type,
    multiple,
    options,
  }: CategoryAttributeInputDto): void {
    const hasOptions = options.length > 0;

    if (hasOptions && !OPTIONS_ALLOWED[type]) {
      throw new BadRequestException(
        `Attribute "${label}": type "${type}" cannot have options`,
      );
    }

    if (multiple && !hasOptions) {
      throw new BadRequestException(
        `Attribute "${label}": multiple requires options`,
      );
    }
  }
}
