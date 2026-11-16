export const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

export type NodeEnv = (typeof NODE_ENV)[keyof typeof NODE_ENV];

export const NODE_ENVS = Object.values(NODE_ENV) as [NodeEnv, ...NodeEnv[]];
