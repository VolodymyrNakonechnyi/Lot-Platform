import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { join } from 'node:path';
import { databaseUrl } from '../src/common/env';

export default async function globalSetup(): Promise<void> {
  const url = new URL(databaseUrl());
  const database = url.pathname.slice(1);

  const adminUrl = new URL(url.toString());
  adminUrl.pathname = '/postgres';

  const admin = new Pool({ connectionString: adminUrl.toString() });
  try {
    const { rowCount } = await admin.query(
      'select 1 from pg_database where datname = $1',
      [database],
    );
    if (!rowCount) {
      await admin.query(`CREATE DATABASE "${database}"`);
    }
  } finally {
    await admin.end();
  }

  const pool = new Pool({ connectionString: url.toString() });
  try {
    await migrate(drizzle(pool), {
      migrationsFolder: join(__dirname, '..', 'drizzle'),
    });
  } finally {
    await pool.end();
  }
}
