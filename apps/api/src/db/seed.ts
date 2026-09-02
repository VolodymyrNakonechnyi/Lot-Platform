import { existsSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users, type NewUser } from './schema';

const seedUsers: NewUser[] = [
  { email: 'vova@example.com', name: 'Vova' },
  { email: 'olena@example.com', name: 'Olena' },
  { email: 'taras@example.com', name: 'Taras' },
  { email: 'marta@example.com', name: 'Marta' },
  { email: 'ihor@example.com', name: 'Ihor' },
];

async function seed(): Promise<void> {
  if (existsSync('.env')) process.loadEnvFile('.env');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    const inserted = await db
      .insert(users)
      .values(seedUsers)
      .onConflictDoNothing({ target: users.email })
      .returning();

    const total = await db.$count(users);
    console.log(`seeded ${inserted.length} of ${seedUsers.length}, users in table: ${total}`);
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
