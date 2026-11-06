import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { Category, CategoryWithAttributes } from '@app/contracts';
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
}
