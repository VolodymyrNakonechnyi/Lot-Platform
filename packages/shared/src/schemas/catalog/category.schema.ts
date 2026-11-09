import { z } from 'zod';
import { ATTRIBUTE_TYPES } from '../../enums.js';

export const categoryId = z.coerce.number().int().positive();

export const categoryIdParamSchema = z.strictObject({
  id: categoryId,
});

export type CategoryIdParamDto = z.infer<typeof categoryIdParamSchema>;

export const categorySchema = z.object({
  id: categoryId,
  name: z.string().min(1),
  slug: z.string().min(1),
  parentId: categoryId.nullable(),
});

export type Category = z.infer<typeof categorySchema>;

export const categoriesSchema = z.array(categorySchema);

export const categoryAttributeOptionSchema = z.object({
  id: z.number().int().positive(),
  attributeId: z.number().int().positive(),
  value: z.string().min(1),
  label: z.string().min(1),
  sortOrder: z.number().int(),
});

export type CategoryAttributeOption = z.infer<
  typeof categoryAttributeOptionSchema
>;

export const categoryAttributeSchema = z.object({
  id: z.number().int().positive(),
  categoryId: categoryId,
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(ATTRIBUTE_TYPES),
  multiple: z.boolean(),
  unit: z.string().nullable(),
  required: z.boolean(),
  filterable: z.boolean(),
  options: z.array(categoryAttributeOptionSchema),
});

export type CategoryAttribute = z.infer<typeof categoryAttributeSchema>;

export const categoryWithAttributesSchema = categorySchema.extend({
  attributes: z.array(categoryAttributeSchema),
});

export type CategoryWithAttributes = z.infer<
  typeof categoryWithAttributesSchema
>;

export const createCategoryAttributeOptionSchema = z.strictObject({
  value: z.string().trim().min(1, 'option_value_required').max(100),
  label: z.string().trim().min(1, 'option_label_required').max(100),
  sortOrder: z.number().int().nonnegative().default(0),
});

export type CreateCategoryAttributeOptionDto = z.infer<
  typeof createCategoryAttributeOptionSchema
>;

export const createCategoryAttributeSchema = z.strictObject({
  key: z
    .string()
    .trim()
    .min(1, 'key_required')
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, 'invalid_key'),
  label: z.string().trim().min(1, 'label_required').max(100),
  type: z.enum(ATTRIBUTE_TYPES),
  multiple: z.boolean().default(false),
  unit: z.string().trim().min(1).max(16).nullable().default(null),
  required: z.boolean().default(false),
  filterable: z.boolean().default(false),
  options: z.array(createCategoryAttributeOptionSchema).default([]),
});

export type CreateCategoryAttributeDto = z.infer<
  typeof createCategoryAttributeSchema
>;

export const createCategorySchema = z.strictObject({
  name: z.string().trim().min(1, 'name_required').max(100),
  slug: z
    .string()
    .trim()
    .min(1, 'slug_required')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'invalid_slug'),
  parentId: categoryId.nullable().default(null),
  attributes: z.array(createCategoryAttributeSchema),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
