import { z } from 'zod';
import {
  ATTRIBUTE_TYPES,
  DELIVERY_PAYMENTS,
  LOT_STATUS,
  LOT_STATUSES,
} from '../../enums.js';
import { categoryId } from '../catalog/category.schema.js';

export const lotId = z.uuid();

export type LotId = z.infer<typeof lotId>;

export const lotIdParamSchema = z.strictObject({
  id: lotId,
});

export type LotIdParamDto = z.infer<typeof lotIdParamSchema>;

export const CREATABLE_LOT_STATUSES = [
  LOT_STATUS.DRAFT,
  LOT_STATUS.PENDING,
] as const;

export const CANCELLABLE_LOT_STATUSES = [
  LOT_STATUS.DRAFT,
  LOT_STATUS.PENDING,
  LOT_STATUS.PUBLISHED,
  LOT_STATUS.REJECTED,
] as const;

export const isoDateTime = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString() : value),
  z.iso.datetime({ offset: true }),
);

export const money = z
  .union([
    z.number(),
    z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, 'invalid_money'),
  ])
  .transform((value) => (typeof value === 'number' ? value : Number(value)))
  .refine((value) => value > 0 && value <= 9_999_999_999, 'invalid_money')
  .transform((value) => value.toFixed(2));

export const lotCategorySchema = z.object({
  id: categoryId,
  name: z.string(),
  slug: z.string(),
  parentId: categoryId.nullable(),
});

export type LotCategory = z.infer<typeof lotCategorySchema>;

export const lotUserSchema = z.object({
  id: z.uuid(),
  username: z.string().nullable(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export type LotUser = z.infer<typeof lotUserSchema>;

export const lotImageSchema = z.object({
  url: z.string(),
  sortOrder: z.number().int(),
});

export type LotImage = z.infer<typeof lotImageSchema>;

export const lotDeliveryOptionSchema = z.object({
  payment: z.enum(DELIVERY_PAYMENTS),
  note: z.string().nullable(),
  method: z.object({
    slug: z.string(),
    name: z.string(),
    sortOrder: z.number().int(),
  }),
});

export type LotDeliveryOption = z.infer<typeof lotDeliveryOptionSchema>;

export const lotAttributeSchema = z.object({
  value: z.string(),
  categoryAttribute: z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(ATTRIBUTE_TYPES),
    unit: z.string().nullable(),
    multiple: z.boolean(),
    filterable: z.boolean(),
  }),
});

export type LotAttribute = z.infer<typeof lotAttributeSchema>;

export const lotDetailsSchema = z.object({
  id: lotId,
  name: z.string(),
  status: z.enum(LOT_STATUSES),
  startPrice: z.string(),
  soldPrice: z.string().nullable(),
  minBidStep: z.string(),
  description: z.string().nullable(),
  returnPolicy: z.string().nullable(),
  startDate: isoDateTime,
  endDate: isoDateTime,
  updatedAt: isoDateTime,
  createdAt: isoDateTime,
  currentPrice: z.string(),
  bidCount: z.number().int(),
  category: lotCategorySchema,
  buyer: lotUserSchema.nullable(),
  seller: lotUserSchema,
  images: z.array(lotImageSchema),
  deliveryOptions: z.array(lotDeliveryOptionSchema),
  attributes: z.array(lotAttributeSchema),
});

export type LotDetails = z.infer<typeof lotDetailsSchema>;

export type LotDetailsRow = z.input<typeof lotDetailsSchema>;

export const lotAttributeInputSchema = z.strictObject({
  key: z.string().trim().min(1, 'attribute_key_required').max(100),
  value: z.string().trim().min(1, 'attribute_value_required').max(500),
});

export type LotAttributeInputDto = z.infer<typeof lotAttributeInputSchema>;

export const lotDeliveryOptionInputSchema = z.strictObject({
  method: z.string().trim().min(1, 'delivery_method_required').max(100),
  payment: z.enum(DELIVERY_PAYMENTS),
  note: z.string().trim().max(500).nullable().default(null),
});

export type LotDeliveryOptionInputDto = z.infer<
  typeof lotDeliveryOptionInputSchema
>;

export const lotImageInputSchema = z.strictObject({
  url: z.url('invalid_image_url').max(2048),
  sortOrder: z.number().int().nonnegative().optional(),
});

export type LotImageInputDto = z.infer<typeof lotImageInputSchema>;

const endsAfterStart = {
  message: 'end_date_before_start_date',
  path: ['endDate'] as PropertyKey[],
};

export const lotInputSchema = z.strictObject({
  name: z.string().trim().min(3, 'name_too_short').max(200),
  categoryId,
  startPrice: money,
  minBidStep: money.default('1.00'),
  description: z.string().trim().max(5000).nullable().default(null),
  returnPolicy: z.string().trim().max(2000).nullable().default(null),
  startDate: isoDateTime,
  endDate: isoDateTime,
  attributes: z.array(lotAttributeInputSchema).max(100).default([]),
  deliveryOptions: z.array(lotDeliveryOptionInputSchema).max(20).default([]),
  images: z.array(lotImageInputSchema).max(8).default([]),
});

export type LotInputDto = z.infer<typeof lotInputSchema>;
export const createLotSchema = lotInputSchema
  .extend({
    status: z.enum(CREATABLE_LOT_STATUSES).default(LOT_STATUS.DRAFT),
  })
  .refine(({ startDate, endDate }) => startDate < endDate, endsAfterStart);

export type CreateLotDto = z.infer<typeof createLotSchema>;

export const updateLotSchema = lotInputSchema.refine(
  ({ startDate, endDate }) => startDate < endDate,
  endsAfterStart,
);

export type UpdateLotDto = z.infer<typeof updateLotSchema>;

export const placeBidSchema = z.strictObject({
  amount: money,
});

export type PlaceBidDto = z.infer<typeof placeBidSchema>;
