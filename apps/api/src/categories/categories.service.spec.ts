import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, like } from 'drizzle-orm';
import { Pool } from 'pg';
import {
  ATTRIBUTE_TYPE,
  categorySchema,
  categoryWithAttributesSchema,
  categoriesSchema,
  createCategorySchema,
  type CreateCategoryDto,
} from '@app/contracts';
import { DRIZZLE } from '../db/db.module';
import type { Database } from '../db/types';
import * as schema from '../db/schema';
import { categories, categoryAttributes } from '../db/schema';
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

  describe('createCategory', () => {
    const slug = `spec-${Date.now()}`;
    let db: Database;

    const body = (over: Partial<CreateCategoryDto> = {}): CreateCategoryDto =>
      createCategorySchema.parse({
        name: 'Spec category',
        slug,
        attributes: [
          {
            key: 'brand',
            label: 'Brand',
            type: ATTRIBUTE_TYPE.STRING,
            required: true,
            filterable: true,
            options: [
              { value: 'Apple', label: 'Apple' },
              { value: 'Dell', label: 'Dell', sortOrder: 1 },
            ],
          },
          {
            key: 'ports',
            label: 'Ports',
            type: ATTRIBUTE_TYPE.STRING,
            multiple: true,
            options: [
              { value: 'usb_c', label: 'USB-C' },
              { value: 'hdmi', label: 'HDMI', sortOrder: 1 },
            ],
          },
          {
            key: 'ram_gb',
            label: 'RAM',
            type: ATTRIBUTE_TYPE.NUMBER,
            unit: 'GB',
          },
        ],
        ...over,
      });

    beforeAll(() => {
      db = drizzle(pool, { schema });
    });

    afterAll(async () => {
      const made = await db
        .select({ id: categories.id })
        .from(categories)
        .where(like(categories.slug, `${slug}%`));

      for (const { id } of made) {
        await db
          .delete(categoryAttributes)
          .where(eq(categoryAttributes.categoryId, id));
        await db.delete(categories).where(eq(categories.id, id));
      }
    });

    it('stores the attributes and options it was given', async () => {
      const created = await service.createCategory(body());
      const saved = await service.getCategory(created.id);

      expect(saved?.attributes.map((attribute) => attribute.key)).toEqual([
        'brand',
        'ports',
        'ram_gb',
      ]);
      expect(saved?.attributes[1].multiple).toBe(true);
      expect(
        saved?.attributes[1].options.map((option) => option.value),
      ).toEqual(['usb_c', 'hdmi']);
      expect(saved?.attributes[2].options).toEqual([]);
    });

    it('returns the category it created with its attributes', async () => {
      const created = await service.createCategory(
        body({ slug: `${slug}-tree` }),
      );

      expect(categoryWithAttributesSchema.safeParse(created).success).toBe(
        true,
      );
      expect(Object.keys(created).sort()).toEqual(
        Object.keys(categoryWithAttributesSchema.shape).sort(),
      );
    });

    it('answers a conflict when the slug is taken', async () => {
      await service.createCategory(body({ slug: `${slug}-taken` }));

      await expect(
        service.createCategory(body({ slug: `${slug}-taken` })),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('answers a conflict when two attributes share a key', async () => {
      const payload = body({ slug: `${slug}-dupkey` });
      payload.attributes[1].key = payload.attributes[0].key;

      await expect(service.createCategory(payload)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('refuses an empty attribute list', async () => {
      await expect(
        service.createCategory(body({ slug: `${slug}-empty`, attributes: [] })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('names the attribute and type when a date carries options', async () => {
      const payload = body({ slug: `${slug}-date` });
      payload.attributes[1] = {
        key: 'released',
        label: 'Released',
        type: ATTRIBUTE_TYPE.DATE,
        multiple: false,
        unit: null,
        required: false,
        filterable: false,
        options: [{ value: 'a', label: 'A', sortOrder: 0 }],
      };

      await expect(service.createCategory(payload)).rejects.toThrow(
        'Attribute "released": type "date" cannot have options',
      );
    });

    it('refuses a boolean attribute that is multiple', async () => {
      const payload = body({ slug: `${slug}-bool` });
      payload.attributes[1] = {
        key: 'touchscreen',
        label: 'Touchscreen',
        type: ATTRIBUTE_TYPE.BOOLEAN,
        multiple: true,
        unit: null,
        required: false,
        filterable: false,
        options: [],
      };

      await expect(service.createCategory(payload)).rejects.toThrow(
        'Attribute "touchscreen": multiple requires options',
      );
    });

    it('accepts options without multiple, which is a plain select', async () => {
      const payload = body({ slug: `${slug}-select` });
      payload.attributes[1].multiple = false;

      const created = await service.createCategory(payload);
      const saved = await service.getCategory(created.id);

      expect(saved?.attributes[1].multiple).toBe(false);
      expect(saved?.attributes[1].options).toHaveLength(2);
    });

    it('refuses a multiple attribute without options', async () => {
      const payload = body({ slug: `${slug}-nooptions` });
      payload.attributes[1].options = [];

      await expect(service.createCategory(payload)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('createCategory validation order', () => {
    const transaction = jest.fn();
    const offline = new CategoriesService({ transaction } as never);

    const payload = (attributes: unknown[]): CreateCategoryDto =>
      createCategorySchema.parse({
        name: 'Spec',
        slug: 'spec-offline',
        attributes,
      });

    beforeEach(() => transaction.mockClear());

    it('rejects a bad attribute without opening a transaction', async () => {
      await expect(
        offline.createCategory(
          payload([
            { key: 'ok', label: 'Ok', type: ATTRIBUTE_TYPE.STRING },
            {
              key: 'released',
              label: 'Released',
              type: ATTRIBUTE_TYPE.DATE,
              multiple: true,
              options: [{ value: 'a', label: 'A' }],
            },
          ]),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(transaction).not.toHaveBeenCalled();
    });

    it('rejects an empty attribute list without opening a transaction', async () => {
      await expect(offline.createCategory(payload([]))).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(transaction).not.toHaveBeenCalled();
    });
  });
});
