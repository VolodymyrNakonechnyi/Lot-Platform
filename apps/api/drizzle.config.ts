import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';
import { appConfig } from './src/config/config';

if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: appConfig().database.url },
  migrations: { table: '__drizzle_migrations', schema: 'drizzle' },
  verbose: true,
});
