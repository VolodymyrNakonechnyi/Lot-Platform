import { z } from 'zod';
import { NODE_ENV, NODE_ENVS } from '../common/env';

export const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVS).default(NODE_ENV.DEVELOPMENT),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_URL: z.url(),
  WEB_ORIGIN: z.url(),

  DATABASE_URL: z.url(),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  TEST_DATABASE_URL: z.url().optional(),
  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),

  SMTP_URL: z.url().optional(),
  MAIL_FROM: z.string().min(1),
  MAIL_REDIRECT_TO: z.email().optional(),

  JWT_PRIVATE_KEY: z.string().startsWith('-----BEGIN PRIVATE KEY-----'),
  JWT_KID: z.string().min(1),
  TOTP_ENCRYPTION_KEY: z.string().min(1),

  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  CDN_BASE_URL: z.url().optional(),

  SEED_PASSWORD: z.string().min(8).default('mockadmin123'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(source: Record<string, unknown>): Env {
  const present = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== ''),
  );
  const parsed = envSchema.safeParse(present);

  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables\n${z.prettifyError(parsed.error)}`,
    );
  }

  return parsed.data;
}
