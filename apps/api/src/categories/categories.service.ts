import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import {
  OPTIONS_ALLOWED,
  type Category,
  type CategoryWithAttributes,
  type CreateCategoryAttributeDto,
  type CreateCategoryDto,
} from '@app/contracts';
import { DRIZZLE, type Database, type Transaction } from '../db/db.module';
import {
  categories,
  categoryAttributeOptions,
  categoryAttributes,
  type CategoryAttribute as CategoryAttributeRow,
  type CategoryAttributeOption as CategoryAttributeOptionRow,
} from 'src/db/schema';
import { isForeignKeyViolation, isUniqueViolation } from 'src/db/errors';

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

  private checkHasAttributes(attributes: CreateCategoryAttributeDto[]): void {
    if (!attributes.length) {
      throw new BadRequestException('The category must have attributes');
    }
  }

  private validateAttributes(attributes: CreateCategoryAttributeDto[]): void {
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
    attributes: CreateCategoryAttributeDto[],
  ): Promise<CategoryAttributeRow[]> {
    if (!attributes.length) return [];

    try {
      return await tx
        .insert(categoryAttributes)
        .values(
          attributes.map(({ key, label, type, multiple }) => ({
            key,
            label,
            type,
            multiple,
            categoryId,
          })),
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
    attributes: CreateCategoryAttributeDto[],
  ): Promise<CategoryAttributeOptionRow[]> {
    const attributeIdByKey = new Map(
      insertedAttributes.map(({ key, id }) => [key, id]),
    );

    const rows = attributes.flatMap(({ key, options }) =>
      options.map(({ value, label }) => ({
        value,
        label,
        attributeId: attributeIdByKey.get(key)!,
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
    key,
    type,
    multiple,
    options,
  }: CreateCategoryAttributeDto): void {
    const hasOptions = options.length > 0;

    if (hasOptions && !OPTIONS_ALLOWED[type]) {
      throw new BadRequestException(
        `Attribute "${key}": type "${type}" cannot have options`,
      );
    }

    if (multiple && !hasOptions) {
      throw new BadRequestException(
        `Attribute "${key}": multiple requires options`,
      );
    }
  }
}
