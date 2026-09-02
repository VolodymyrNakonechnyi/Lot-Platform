import { sql } from 'drizzle-orm';
import { pgEnum } from 'drizzle-orm/pg-core';
import { boolean } from 'drizzle-orm/pg-core';
import { check } from 'drizzle-orm/pg-core';
import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

const ROLES = ['user', 'moderator', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
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
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('users_email_idx').on(table.email),
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
