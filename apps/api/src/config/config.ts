import { validateEnv, type Env } from './env.schema';

export interface AppConfig {
  nodeEnv: Env['NODE_ENV'];
  port: number;
  appUrl: string;
  webOrigin: string;
  database: {
    url: string;
    testUrl?: string;
  };
  redis: {
    host: string;
    port: number;
  };
  mail: {
    smtpUrl?: string;
    from: string;
    redirectTo?: string;
  };
  jwt: {
    privateKey: string;
    kid: string;
  };
  mfa: {
    totpEncryptionKey: string;
  };
  google: {
    clientId?: string;
    clientSecret?: string;
  };
  storage: {
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    cdnBaseUrl: string;
  };
}

export default (): AppConfig => {
  const env = validateEnv(process.env);

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    appUrl: env.APP_URL,
    webOrigin: env.WEB_ORIGIN,

    database: {
      url: env.DATABASE_URL,
      testUrl: env.TEST_DATABASE_URL,
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
  };
};
