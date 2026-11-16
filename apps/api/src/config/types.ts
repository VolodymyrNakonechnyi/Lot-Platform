import type { NodeEnv } from '../common/env';

export interface DatabaseConfig {
  url: string;
}

export interface RedisConfig {
  host: string;
  port: number;
}

export interface MailConfig {
  smtpUrl?: string;
  from: string;
  redirectTo?: string;
}

export interface JwtConfig {
  privateKey: string;
  kid: string;
}

export interface MfaConfig {
  totpEncryptionKey: string;
}

export interface GoogleConfig {
  clientId?: string;
  clientSecret?: string;
}

export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  cdnBaseUrl: string;
}

export interface SeedConfig {
  password: string;
}

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  appUrl: string;
  webOrigin: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  mail: MailConfig;
  jwt: JwtConfig;
  mfa: MfaConfig;
  google: GoogleConfig;
  storage: StorageConfig;
  seed: SeedConfig;
}
