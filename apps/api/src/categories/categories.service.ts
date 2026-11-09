import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import {
  ATTRIBUTE_TYPE,
  type Category,
  type CategoryWithAttributes,
  type CreateCategoryAttributeDto,
  type CreateCategoryDto,
} from '@app/contracts';
import { DRIZZLE, type Database } from '../db/db.module';
import {
  categories,
  categoryAttributeOptions,
  categoryAttributes,
} from 'src/db/schema';

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

  async createCategory(createCategory: CreateCategoryDto) {
    const { attributes = [], ...categoryData } = createCategory;

    this.checkHasAttributes(attributes);

    return this.db.transaction(async (tx) => {
      const [category] = await tx
        .insert(categories)
        .values(categoryData)
        .returning();

      for (const attribute of attributes) {
        this.checkAttribute(attribute);

        const { options, ...attrData } = attribute;
        const [inserted] = await tx
          .insert(categoryAttributes)
          .values({ ...attrData, categoryId: category.id })
          .returning();

        if (options.length) {
          await tx.insert(categoryAttributeOptions).values(
            options.map((option) => ({
              ...option,
              attributeId: inserted.id,
            })),
          );
        }
      }
      return category;
    });
  }

  private checkHasAttributes(attributes: CreateCategoryAttributeDto[]): void {
    if (!attributes.length) {
      throw new BadRequestException('The category must have attributes');
    }
  }

  private checkAttribute({
    type,
    multiple,
    options,
  }: CreateCategoryAttributeDto): void {
    if (type !== ATTRIBUTE_TYPE.STRING && (multiple || options.length)) {
      throw new BadRequestException(
        `A ${type} field can be neither multiple nor carry options`,
      );
    }

    if (multiple && !options.length) {
      throw new BadRequestException('Multiple field must have an options');
    }
  }
}
