import { sql } from 'drizzle-orm';
import { AnyPgColumn } from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';
import { jsonb } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { primaryKey } from 'drizzle-orm/pg-core';
import { decimal } from 'drizzle-orm/pg-core';
import { smallint } from 'drizzle-orm/pg-core';
import { boolean } from 'drizzle-orm/pg-core';
import { check } from 'drizzle-orm/pg-core';
import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  serial,
} from 'drizzle-orm/pg-core';

const ROLES = ['user', 'moderator', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    username: text('username').notNull().unique(),
    avatarUrl: text('avatar_url'),
    role: text('role', { enum: ROLES }).notNull().default('user'),
    password: text().notNull(),
    email: text('email').notNull(),
    confirmedEmail: boolean('confirmed_email').notNull().default(false),
    name: text('name').notNull(),
    phoneNumber: text('phone_number').notNull().unique(),
    confirmedPhoneNumber: boolean('confirmed_phone_number')
      .notNull()
      .default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastLogin: timestamp('last_login', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('users_email_idx').on(sql`lower(${table.email})`),
    check('phone_format', sql`${table.phoneNumber} ~ '^[1-9][0-9]{6,14}$'`),
    check(
      'role_valid',
      sql`${table.role} IN (${sql.join(
        ROLES.map((r) => sql`${r}`),
        sql`, `,
      )})`,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const categories = pgTable(
  'categories',
  {
    id: smallint('id').generatedAlwaysAsIdentity().primaryKey(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    parentId: smallint('parent_id').references(
      (): AnyPgColumn => categories.id,
    ),
  },
  (table) => [
    uniqueIndex('categories_id_parent_idx').on(table.id, table.parentId),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

const ATTRIBUTE_TYPES = [
  'string',
  'number',
  'boolean',
  'select',
  'multiselect',
] as const;

export const categoryAttributes = pgTable('category_attributes', {
  id: serial('id').primaryKey(),
  categoryId: smallint('category_id')
    .references(() => categories.id)
    .notNull(),
  key: text('key').notNull(),
  label: text('label').notNull(),
  type: text('type', { enum: ATTRIBUTE_TYPES }).notNull(),
  options: jsonb('options').$type<string[]>(),
  unit: text('unit'),
  required: boolean('required').notNull().default(false),
  filterable: boolean('filterable').notNull().default(false),
});

const LOT_STATUSES = [
  'draft',
  'pending',
  'published',
  'rejected',
  'reserved',
  'sold',
  'expired',
  'cancelled',
  'blocked',
] as const;
export type LotStatus = (typeof LOT_STATUSES)[number];

export const lots = pgTable(
  'lots',
  {
    id: serial('id').primaryKey(),
    name: text().notNull(),
    categoryId: smallint('category_id')
      .references(() => categories.id)
      .notNull(),
    sellerId: uuid('seller_id')
      .references(() => users.id)
      .notNull(),
    buyerId: uuid('buyer_id').references(() => users.id),
    status: text('status', { enum: LOT_STATUSES }).notNull().default('draft'),
    startPrice: decimal('start_price', { precision: 12, scale: 2 }).notNull(),
    soldPrice: decimal('sold_price', { precision: 12, scale: 2 }),
    currentPrice: decimal('current_price', { precision: 12, scale: 2 }),
    minBidStep: decimal('min_bid_step', { precision: 12, scale: 2 })
      .notNull()
      .default('1.00'),
    description: text(),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'role_valid',
      sql`${table.status} IN (${sql.join(
        LOT_STATUSES.map((r) => sql`${r}`),
        sql`, `,
      )})`,
    ),
    check('end_date_valid', sql`${table.startDate} < ${table.endDate}`),
    index('lots_published_category_idx')
      .on(table.categoryId)
      .where(sql`${table.status} = 'published'`),
  ],
);

export type Lot = typeof lots.$inferSelect;
export type NewLot = typeof lots.$inferInsert;

export const lostAttributes = pgTable(
  'lots_attributes',
  {
    lotId: integer('lot_id')
      .references(() => lots.id)
      .notNull(),
    categoryAttributeId: integer('category_attribute_id')
      .references(() => categoryAttributes.id)
      .notNull(),
    value: text('value').notNull(),
    valueNumber: decimal('value_number', { precision: 12, scale: 2 }),
  },
  (table) => [
    primaryKey({ columns: [table.lotId, table.categoryAttributeId] }),
    index('lav_attr_value_idx').on(table.categoryAttributeId, table.value),
    index('lav_attr_number_idx').on(
      table.categoryAttributeId,
      table.valueNumber,
    ),
  ],
);

export const bids = pgTable(
  'bids',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    lotId: integer('lot_id')
      .references(() => lots.id, { onDelete: 'cascade' })
      .notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('bid_amount_positive', sql`${table.amount} > 0`),
    uniqueIndex('bids_lot_amount_idx').on(table.lotId, table.amount),
    index('bids_lot_top_idx').on(table.lotId, sql`${table.amount} DESC`),
    index('bids_user_idx').on(table.userId, sql`${table.createdAt} DESC`),
  ],
);

export type Bid = typeof bids.$inferSelect;
export type NewBit = typeof bids.$inferInsert;
