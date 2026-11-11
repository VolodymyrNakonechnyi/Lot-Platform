import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, like } from 'drizzle-orm';
import { Pool } from 'pg';
import {
  ATTRIBUTE_TYPE,
  categorySchema,
  categoryWithAttributesSchema,
  categoriesSchema,
  categoryInputSchema,
  type CreateCategoryDto,
} from '@app/contracts';
import { DRIZZLE } from '../db/db.module';
import type { Database } from '../db/types';
import * as schema from '../db/schema';
import {
  categories,
  categoryAttributeOptions,
  categoryAttributes,
  lostAttributes,
  lots,
  users,
} from '../db/schema';
import { CategoriesService } from './categories.service';
import { databaseUrl } from '../common/env';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl() });

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
    let db: Database;
    let fixtureId: number;

    beforeAll(async () => {
      db = drizzle(pool, { schema });
      const created = await service.createCategory(
        categoryInputSchema.parse({
          name: 'Read fixture',
          slug: `spec-read-${Date.now()}`,
          attributes: [
            {
              label: 'Brand',
              type: ATTRIBUTE_TYPE.STRING,
              options: [{ value: 'Apple', label: 'Apple' }],
            },
          ],
        }),
      );
      fixtureId = created.id;
    });

    afterAll(async () => {
      await db
        .delete(categoryAttributes)
        .where(eq(categoryAttributes.categoryId, fixtureId));
      await db.delete(categories).where(eq(categories.id, fixtureId));
    });

    it('returns the category with its attributes and options', async () => {
      const category = await service.getCategory(fixtureId);

      expect(categoryWithAttributesSchema.safeParse(category).success).toBe(
        true,
      );
      expect(Object.keys(category!).sort()).toEqual(
        Object.keys(categoryWithAttributesSchema.shape).sort(),
      );
      expect(category!.attributes[0].options).toHaveLength(1);
    });

    it('answers null for an id that does not exist', async () => {
      expect(await service.getCategory(-1)).toBeNull();
    });
  });

  describe('createCategory', () => {
    const slug = `spec-${Date.now()}`;
    let db: Database;

    const body = (over: Partial<CreateCategoryDto> = {}): CreateCategoryDto =>
      categoryInputSchema.parse({
        name: 'Spec category',
        slug,
        attributes: [
          {
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
            label: 'Ports',
            type: ATTRIBUTE_TYPE.STRING,
            multiple: true,
            options: [
              { value: 'usb_c', label: 'USB-C' },
              { value: 'hdmi', label: 'HDMI', sortOrder: 1 },
            ],
          },
          {
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
        'ram',
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
      payload.attributes[1].label = payload.attributes[0].label;

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
        label: 'Released',
        type: ATTRIBUTE_TYPE.DATE,
        multiple: false,
        unit: null,
        required: false,
        filterable: false,
        options: [{ value: 'a', label: 'A', sortOrder: 0 }],
      };

      await expect(service.createCategory(payload)).rejects.toThrow(
        'Attribute "Released": type "date" cannot have options',
      );
    });

    it('refuses a boolean attribute that is multiple', async () => {
      const payload = body({ slug: `${slug}-bool` });
      payload.attributes[1] = {
        label: 'Touchscreen',
        type: ATTRIBUTE_TYPE.BOOLEAN,
        multiple: true,
        unit: null,
        required: false,
        filterable: false,
        options: [],
      };

      await expect(service.createCategory(payload)).rejects.toThrow(
        'Attribute "Touchscreen": multiple requires options',
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
      categoryInputSchema.parse({
        name: 'Spec',
        slug: 'spec-offline',
        attributes,
      });

    beforeEach(() => transaction.mockClear());

    it('rejects a bad attribute without opening a transaction', async () => {
      await expect(
        offline.createCategory(
          payload([
            { label: 'Ok', type: ATTRIBUTE_TYPE.STRING },
            {
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

  describe('updateCategory', () => {
    const slug = `spec-upd-${Date.now()}`;
    let db: Database;
    let categoryId: number;

    const body = (over: Partial<CreateCategoryDto> = {}): CreateCategoryDto =>
      categoryInputSchema.parse({
        name: 'Laptops',
        slug,
        attributes: [
          {
            label: 'Brand',
            type: ATTRIBUTE_TYPE.STRING,
            required: true,
            options: [
              { value: 'Apple', label: 'Apple' },
              { value: 'Dell', label: 'Dell', sortOrder: 1 },
            ],
          },
          {
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

    beforeEach(async () => {
      const created = await service.createCategory(body());
      categoryId = created.id;
    });

    afterEach(async () => {
      await db
        .delete(categoryAttributes)
        .where(eq(categoryAttributes.categoryId, categoryId));
      await db.delete(categories).where(eq(categories.id, categoryId));
    });

    it('replaces the category fields', async () => {
      const updated = await service.updateCategory(
        categoryId,
        body({ name: 'Notebooks', slug: `${slug}-renamed` }),
      );

      expect(updated.id).toBe(categoryId);
      expect(updated.name).toBe('Notebooks');
      expect(updated.slug).toBe(`${slug}-renamed`);
      expect(categoryWithAttributesSchema.safeParse(updated).success).toBe(
        true,
      );
    });

    it('keeps the id of an attribute that stays under the same key', async () => {
      const before = await service.getCategory(categoryId);
      const brandId = before!.attributes.find((a) => a.key === 'brand')!.id;

      const payload = body();
      payload.attributes[0].label = 'Manufacturer';
      payload.attributes[0].required = false;
      payload.attributes[0].filterable = true;

      await service.updateCategory(categoryId, payload);
      const after = await service.getCategory(categoryId);
      const brand = after!.attributes.find((a) => a.key === 'brand')!;

      expect(brand.id).toBe(brandId);
      expect(brand.label).toBe('Manufacturer');
      expect(brand.required).toBe(false);
      expect(brand.filterable).toBe(true);
    });

    it('adds an attribute that the payload introduces', async () => {
      const payload = body();
      payload.attributes.push(
        categoryInputSchema.shape.attributes.element.parse({
          label: 'Released',
          type: ATTRIBUTE_TYPE.DATE,
        }),
      );

      await service.updateCategory(categoryId, payload);
      const after = await service.getCategory(categoryId);

      expect(after!.attributes.map((a) => a.key).sort()).toEqual([
        'brand',
        'ram',
        'released',
      ]);
    });

    it('drops an attribute the payload omits, with its options', async () => {
      const payload = body();
      payload.attributes = payload.attributes.filter(
        (a) => a.label !== 'Brand',
      );

      await service.updateCategory(categoryId, payload);
      const after = await service.getCategory(categoryId);

      expect(after!.attributes.map((a) => a.key)).toEqual(['ram']);

      const orphans = await db
        .select({ id: categoryAttributeOptions.id })
        .from(categoryAttributeOptions)
        .innerJoin(
          categoryAttributes,
          eq(categoryAttributes.id, categoryAttributeOptions.attributeId),
        )
        .where(eq(categoryAttributes.categoryId, categoryId));

      expect(orphans).toEqual([]);
    });

    it('replaces the options of an attribute it keeps', async () => {
      const payload = body();
      payload.attributes[0].options = [
        { value: 'Lenovo', label: 'Lenovo', sortOrder: 0 },
        { value: 'Asus', label: 'Asus', sortOrder: 1 },
      ];

      const updated = await service.updateCategory(categoryId, payload);
      const brand = updated.attributes.find((a) => a.key === 'brand')!;

      expect(brand.options.map((o) => o.value)).toEqual(['Lenovo', 'Asus']);

      const after = await service.getCategory(categoryId);
      expect(
        after!.attributes.find((a) => a.key === 'brand')!.options.length,
      ).toBe(2);
    });

    it('swaps two attribute labels without tripping the unique constraint', async () => {
      const payload = body();
      payload.attributes[0].label = 'RAM';
      payload.attributes[0].type = ATTRIBUTE_TYPE.NUMBER;
      payload.attributes[0].options = [];
      payload.attributes[1].label = 'Brand';
      payload.attributes[1].type = ATTRIBUTE_TYPE.STRING;
      payload.attributes[1].options = [
        { value: 'Apple', label: 'Apple', sortOrder: 0 },
      ];

      await service.updateCategory(categoryId, payload);
      const after = await service.getCategory(categoryId);

      expect(after!.attributes.map((a) => a.key).sort()).toEqual([
        'brand',
        'ram',
      ]);
      expect(
        after!.attributes.find((a) => a.key === 'brand')!.options,
      ).toHaveLength(1);
    });

    it('answers a conflict when the new slug belongs to another category', async () => {
      const other = await service.createCategory(
        body({ slug: `${slug}-other` }),
      );

      try {
        await expect(
          service.updateCategory(categoryId, body({ slug: `${slug}-other` })),
        ).rejects.toBeInstanceOf(ConflictException);
      } finally {
        await db
          .delete(categoryAttributes)
          .where(eq(categoryAttributes.categoryId, other.id));
        await db.delete(categories).where(eq(categories.id, other.id));
      }
    });

    it('answers not found for an id that does not exist', async () => {
      await expect(service.updateCategory(-1, body())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('refuses to drop an attribute a lot already uses', async () => {
      const before = await service.getCategory(categoryId);
      const brandId = before!.attributes.find((a) => a.key === 'brand')!.id;

      const [seller] = await db
        .insert(users)
        .values({ email: `spec-seller-${Date.now()}@example.com` })
        .returning({ id: users.id });
      const [lot] = await db
        .insert(lots)
        .values({
          name: 'Spec lot',
          categoryId,
          sellerId: seller.id,
          startPrice: '10.00',
          startDate: new Date(Date.now() + 60_000),
          endDate: new Date(Date.now() + 120_000),
        })
        .returning({ id: lots.id });

      await db.insert(lostAttributes).values({
        lotId: lot.id,
        categoryAttributeId: brandId,
        value: 'Apple',
      });

      const payload = body();
      payload.attributes = payload.attributes.filter(
        (a) => a.label !== 'Brand',
      );

      try {
        await expect(
          service.updateCategory(categoryId, payload),
        ).rejects.toBeInstanceOf(ConflictException);

        const after = await service.getCategory(categoryId);
        expect(after!.attributes.map((a) => a.key).sort()).toEqual([
          'brand',
          'ram',
        ]);
      } finally {
        await db.delete(lostAttributes).where(eq(lostAttributes.lotId, lot.id));
        await db.delete(lots).where(eq(lots.id, lot.id));
        await db.delete(users).where(eq(users.id, seller.id));
      }
    });

    it('leaves the category untouched when an attribute is invalid', async () => {
      const payload = body();
      payload.name = 'Should not persist';
      payload.attributes[1] =
        categoryInputSchema.shape.attributes.element.parse({
          label: 'Released',
          type: ATTRIBUTE_TYPE.DATE,
          options: [{ value: 'a', label: 'A' }],
        });

      await expect(
        service.updateCategory(categoryId, payload),
      ).rejects.toBeInstanceOf(BadRequestException);

      const after = await service.getCategory(categoryId);
      expect(after!.name).toBe('Laptops');
      expect(after!.attributes.map((a) => a.key).sort()).toEqual([
        'brand',
        'ram',
      ]);
    });
  });

  describe('updateCategory validation order', () => {
    const transaction = jest.fn();
    const offline = new CategoriesService({ transaction } as never);

    const payload = (attributes: unknown[]): CreateCategoryDto =>
      categoryInputSchema.parse({
        name: 'Spec',
        slug: 'spec-offline-update',
        attributes,
      });

    beforeEach(() => transaction.mockClear());

    it('rejects a bad attribute without opening a transaction', async () => {
      await expect(
        offline.updateCategory(
          1,
          payload([
            {
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
      await expect(
        offline.updateCategory(1, payload([])),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(transaction).not.toHaveBeenCalled();
    });
  });
});
