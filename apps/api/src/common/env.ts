export const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

export type NodeEnv = (typeof NODE_ENV)[keyof typeof NODE_ENV];

export const NODE_ENVS = Object.values(NODE_ENV) as [NodeEnv, ...NodeEnv[]];

export function currentEnv(): NodeEnv {
  const value = process.env.NODE_ENV;

  return NODE_ENVS.includes(value as NodeEnv)
    ? (value as NodeEnv)
    : NODE_ENV.DEVELOPMENT;
}

export const isTest = (): boolean => currentEnv() === NODE_ENV.TEST;
export const isProduction = (): boolean => currentEnv() === NODE_ENV.PRODUCTION;
export const isDevelopment = (): boolean =>
  currentEnv() === NODE_ENV.DEVELOPMENT;

export function databaseUrl(): string {
  const variable = isTest() ? 'TEST_DATABASE_URL' : 'DATABASE_URL';
  const url = process.env[variable];

  if (!url) {
    throw new Error(`${variable} is not set`);
  }

  return url;
}
