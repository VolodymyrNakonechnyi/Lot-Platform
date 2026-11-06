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
