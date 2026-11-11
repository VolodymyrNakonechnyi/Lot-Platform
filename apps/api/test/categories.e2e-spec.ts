import {
  ConflictException,
  INestApplication,
  NotFoundException,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ATTRIBUTE_TYPE, ROLE } from '@app/contracts';
import { CategoriesController } from '../src/categories/categories.controller';
import { CategoriesService } from '../src/categories/categories.service';

const service = {
  getAllCategories: jest.fn(),
  getCategory: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
};

let currentUser: { id: string; role: string } | null = null;
function issues(body: unknown): string[] {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const { message } = body;
    return Array.isArray(message) ? message.map(String) : [String(message)];
  }
  return [];
}

const category = {
  id: 7,
  name: 'Laptops',
  slug: 'laptops',
  parentId: null,
  attributes: [
    {
      id: 1,
      categoryId: 7,
      key: 'brand',
      label: 'Brand',
      type: ATTRIBUTE_TYPE.STRING,
      multiple: false,
      unit: null,
      required: true,
      filterable: true,
      options: [
        { id: 1, attributeId: 1, value: 'Apple', label: 'Apple', sortOrder: 0 },
      ],
    },
  ],
};

const body = (over: Record<string, unknown> = {}) => ({
  name: 'Laptops',
  slug: 'laptops',
  attributes: [
    {
      label: 'Brand',
      type: ATTRIBUTE_TYPE.STRING,
      options: [{ value: 'Apple', label: 'Apple' }],
    },
  ],
  ...over,
});

describe('CategoriesController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const fixture: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
        { provide: CategoriesService, useValue: service },
      ],
    }).compile();

    app = fixture.createNestApplication();
    app.use(
      (
        req: { user: unknown },
        _res: unknown,
        next: (error?: unknown) => void,
      ) => {
        req.user = currentUser;
        next();
      },
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    currentUser = { id: 'u1', role: ROLE.ADMIN };
    service.getAllCategories.mockResolvedValue([
      { id: 7, name: 'Laptops', slug: 'laptops', parentId: null },
    ]);
    service.getCategory.mockResolvedValue(category);
    service.createCategory.mockResolvedValue(category);
    service.updateCategory.mockResolvedValue(category);
    service.deleteCategory.mockResolvedValue(undefined);
  });

  describe('GET /categories', () => {
    it('answers 200 with the list', async () => {
      currentUser = null;
      const res = await request(app.getHttpServer()).get('/categories');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { id: 7, name: 'Laptops', slug: 'laptops', parentId: null },
      ]);
    });
  });

  describe('GET /categories/:id', () => {
    it('passes the parsed id on', async () => {
      currentUser = null;
      const res = await request(app.getHttpServer()).get('/categories/7');

      expect(res.status).toBe(200);
      expect(service.getCategory).toHaveBeenCalledWith(7);
    });

    it('answers 400 for an id that is not a number', async () => {
      const res = await request(app.getHttpServer()).get('/categories/abc');

      expect(res.status).toBe(400);
      expect(service.getCategory).not.toHaveBeenCalled();
    });

    it('answers 404 when the service finds nothing', async () => {
      service.getCategory.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get('/categories/7');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /categories', () => {
    it('answers 403 for a signed-in non-admin', async () => {
      currentUser = { id: 'u1', role: ROLE.USER };

      const res = await request(app.getHttpServer())
        .post('/categories')
        .send(body());

      expect(res.status).toBe(403);
      expect(service.createCategory).not.toHaveBeenCalled();
    });

    it('answers 201 and hands the service the parsed body', async () => {
      const res = await request(app.getHttpServer())
        .post('/categories')
        .send(body({ name: '  Laptops  ' }));

      expect(res.status).toBe(201);
      expect(service.createCategory).toHaveBeenCalledWith({
        name: 'Laptops',
        slug: 'laptops',
        parentId: null,
        attributes: [
          {
            label: 'Brand',
            type: ATTRIBUTE_TYPE.STRING,
            multiple: false,
            unit: null,
            required: false,
            filterable: false,
            options: [{ value: 'Apple', label: 'Apple', sortOrder: 0 }],
          },
        ],
      });
    });

    it('answers 400 for a malformed slug', async () => {
      const res = await request(app.getHttpServer())
        .post('/categories')
        .send(body({ slug: 'Not A Slug' }));

      expect(res.status).toBe(400);
      expect(issues(res.body)).toEqual(['slug: invalid_slug']);
      expect(service.createCategory).not.toHaveBeenCalled();
    });

    it('rejects the removed key field', async () => {
      const payload = body();
      payload.attributes[0] = {
        ...payload.attributes[0],
        key: 'brand',
      } as never;

      const res = await request(app.getHttpServer())
        .post('/categories')
        .send(payload);

      expect(res.status).toBe(400);
      expect(issues(res.body)[0]).toMatch(/Unrecognized key/);
      expect(service.createCategory).not.toHaveBeenCalled();
    });
  });

  describe('PUT /categories/:id', () => {
    it('answers 403 for a signed-in non-admin', async () => {
      currentUser = { id: 'u1', role: ROLE.USER };

      const res = await request(app.getHttpServer())
        .put('/categories/7')
        .send(body());

      expect(res.status).toBe(403);
      expect(service.updateCategory).not.toHaveBeenCalled();
    });

    it('answers 200 and passes both the id and the body', async () => {
      const res = await request(app.getHttpServer())
        .put('/categories/7')
        .send(body());

      expect(res.status).toBe(200);
      expect(service.updateCategory).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ slug: 'laptops' }),
      );
    });

    it('answers 400 when attributes are missing', async () => {
      const payload = body();
      delete (payload as { attributes?: unknown }).attributes;

      const res = await request(app.getHttpServer())
        .put('/categories/7')
        .send(payload);

      expect(res.status).toBe(400);
      expect(service.updateCategory).not.toHaveBeenCalled();
    });

    it('surfaces a service conflict as 409', async () => {
      service.updateCategory.mockRejectedValue(
        new ConflictException('Slug "laptops" is already taken'),
      );

      const res = await request(app.getHttpServer())
        .put('/categories/7')
        .send(body());

      expect(res.status).toBe(409);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('answers 403 for a signed-in non-admin', async () => {
      currentUser = { id: 'u1', role: ROLE.USER };

      const res = await request(app.getHttpServer()).delete('/categories/7');

      expect(res.status).toBe(403);
      expect(service.deleteCategory).not.toHaveBeenCalled();
    });

    it('answers 204 with an empty body', async () => {
      const res = await request(app.getHttpServer()).delete('/categories/7');

      expect(res.status).toBe(204);
      expect(res.text).toBe('');
      expect(service.deleteCategory).toHaveBeenCalledWith(7);
    });

    it('surfaces a service not found as 404', async () => {
      service.deleteCategory.mockRejectedValue(
        new NotFoundException('Category 7 not found'),
      );

      const res = await request(app.getHttpServer()).delete('/categories/7');

      expect(res.status).toBe(404);
    });

    it('surfaces a service conflict as 409', async () => {
      service.deleteCategory.mockRejectedValue(
        new ConflictException('Category is used by lots and cannot be removed'),
      );

      const res = await request(app.getHttpServer()).delete('/categories/7');

      expect(res.status).toBe(409);
    });
  });
});
