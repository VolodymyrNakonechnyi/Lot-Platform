import { existsSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { hashPassword } from '../common/password';
import { users, type NewUser } from './schema';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'mockadmin123';

const seedUsers: Omit<NewUser, 'password'>[] = [
  {
    username: 'vova',
    email: 'vova@example.com',
    name: 'Vova',
    phoneNumber: '380671234501',
    role: 'admin',
    confirmedEmail: true,
  },
  {
    username: 'olena',
    email: 'olena@example.com',
    name: 'Olena',
    phoneNumber: '380671234502',
    role: 'moderator',
  },
  {
    username: 'taras',
    email: 'taras@example.com',
    name: 'Taras',
    phoneNumber: '380671234503',
  },
  {
    username: 'marta',
    email: 'marta@example.com',
    name: 'Marta',
    phoneNumber: '380671234504',
  },
  {
    username: 'ihor',
    email: 'ihor@example.com',
    name: 'Ihor',
    phoneNumber: '380671234505',
  },
];

async function seed(): Promise<void> {
  if (existsSync('.env')) process.loadEnvFile('.env');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    const password = await hashPassword(SEED_PASSWORD);

    const seeded = await db
      .insert(users)
      .values(seedUsers.map((user) => ({ ...user, password })))
      .onConflictDoUpdate({
        target: users.username,
        set: {
          password,
          email: sql`excluded.email`,
          role: sql`excluded.role`,
          confirmedEmail: sql`excluded.confirmed_email`,
        },
      })
      .returning();

    const total = await db.$count(users);
    console.log(
      `seeded ${seeded.length} of ${seedUsers.length}, users in table: ${total}`,
    );
    console.log(`seed password: ${SEED_PASSWORD}`);
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
