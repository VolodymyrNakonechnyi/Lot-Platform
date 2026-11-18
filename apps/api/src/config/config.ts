import { NODE_ENV } from '../common/env';
import { validateEnv, type Env } from './env.schema';
import type { AppConfig } from './types';

function databaseUrl(env: Env): string {
  if (env.NODE_ENV !== NODE_ENV.TEST) {
    return env.DATABASE_URL;
  }

  if (!env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL is not set');
  }

  return env.TEST_DATABASE_URL;
}

function build(): AppConfig {
  const env = validateEnv(process.env);

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    appUrl: env.APP_URL,
    webOrigin: env.WEB_ORIGIN,

    database: {
      url: databaseUrl(env),
      poolMax: env.DATABASE_POOL_MAX,
    },

    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    },

    mail: {
      smtpUrl: env.SMTP_URL,
      from: env.MAIL_FROM,
      redirectTo: env.MAIL_REDIRECT_TO,
    },

    jwt: {
      privateKey: env.JWT_PRIVATE_KEY,
      kid: env.JWT_KID,
    },

    mfa: {
      totpEncryptionKey: env.TOTP_ENCRYPTION_KEY,
    },

    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },

    storage: {
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      bucket: env.S3_BUCKET,
      cdnBaseUrl: (
        env.CDN_BASE_URL ?? `${env.S3_ENDPOINT}/${env.S3_BUCKET}`
      ).replace(/\/+$/, ''),
    },

    seed: {
      password: env.SEED_PASSWORD,
    },
  };
}

let cached: AppConfig | undefined;

export function appConfig(): AppConfig {
  return (cached ??= build());
}

export default appConfig;
