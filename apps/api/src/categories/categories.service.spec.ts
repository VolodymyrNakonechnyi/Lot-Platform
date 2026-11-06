import { Test, TestingModule } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  categorySchema,
  categoryWithAttributesSchema,
  categoriesSchema,
} from '@app/contracts';
import { DRIZZLE } from '../db/db.module';
import * as schema from '../db/schema';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: DRIZZLE, useValue: drizzle(pool, { schema }) },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('getAllCategories', () => {
    it('returns rows carrying the contract fields and nothing else', async () => {
      const rows = await service.getAllCategories();

      expect(categoriesSchema.safeParse(rows).success).toBe(true);
      for (const row of rows) {
        expect(Object.keys(row).sort()).toEqual(
          Object.keys(categorySchema.shape).sort(),
        );
      }
    });
  });

  describe('getCategory', () => {
    it('returns the category with its attributes and options', async () => {
      const [first] = await service.getAllCategories();
      const category = await service.getCategory(first.id);

      expect(categoryWithAttributesSchema.safeParse(category).success).toBe(
        true,
      );
      expect(Object.keys(category!).sort()).toEqual(
        Object.keys(categoryWithAttributesSchema.shape).sort(),
      );
    });

    it('answers null for an id that does not exist', async () => {
      expect(await service.getCategory(-1)).toBeNull();
    });
  });
});
