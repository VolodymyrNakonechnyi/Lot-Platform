export const ROLE = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];
export const ROLES = Object.values(ROLE) as [Role, ...Role[]];

export const ATTRIBUTE_TYPE = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
} as const;
export type AttributeType =
  (typeof ATTRIBUTE_TYPE)[keyof typeof ATTRIBUTE_TYPE];
export const ATTRIBUTE_TYPES = Object.values(ATTRIBUTE_TYPE) as [
  AttributeType,
  ...AttributeType[],
];

export const LOT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  RESERVED: 'reserved',
  SOLD: 'sold',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  BLOCKED: 'blocked',
} as const;
export type LotStatus = (typeof LOT_STATUS)[keyof typeof LOT_STATUS];
export const LOT_STATUSES = Object.values(LOT_STATUS) as [
  LotStatus,
  ...LotStatus[],
];

export const DELIVERY_PAYMENT = {
  ON_AGREEMENT: 'on_agreement',
  FULL_PREPAYMENT: 'full_prepayment',
  PARTIAL_PREPAYMENT: 'partial_prepayment',
  ON_RECEIPT: 'on_receipt',
  NOT_PROVIDED: 'not_provided',
} as const;
export type DeliveryPayment =
  (typeof DELIVERY_PAYMENT)[keyof typeof DELIVERY_PAYMENT];
export const DELIVERY_PAYMENTS = Object.values(DELIVERY_PAYMENT) as [
  DeliveryPayment,
  ...DeliveryPayment[],
];

export const PAYMENT_STATUS = {
  CREATED: 'created',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export const PAYMENT_STATUSES = Object.values(PAYMENT_STATUS) as [
  PaymentStatus,
  ...PaymentStatus[],
];

export const ACTIVE_PAYMENT_STATUSES = [
  PAYMENT_STATUS.CREATED,
  PAYMENT_STATUS.PROCESSING,
  PAYMENT_STATUS.SUCCEEDED,
];

export const PAYMENT_PROVIDER = {
  LIQPAY: 'LiqPay',
  STRIPE: 'Stripe',
  FONDY: 'Fondy',
} as const;
export type PaymentProvider =
  (typeof PAYMENT_PROVIDER)[keyof typeof PAYMENT_PROVIDER];
export const PAYMENT_PROVIDERS = Object.values(PAYMENT_PROVIDER) as [
  PaymentProvider,
  ...PaymentProvider[],
];
