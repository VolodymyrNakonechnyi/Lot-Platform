import {
  argon2,
  randomBytes,
  timingSafeEqual,
  type Argon2Algorithm,
} from 'node:crypto';
import { promisify } from 'node:util';

const argon2Async = promisify(argon2);

const COST = {
  parallelism: 4,
  version: 19,
  tagLength: 32,
  memory: 65536,
  passes: 3,
};

export async function hashPassword(password: string): Promise<string> {
  const nonce = randomBytes(16);
  const derivedKey = await argon2Async('argon2id', {
    message: password,
    nonce,
    ...COST,
  });

  const cost = `m=${COST.memory},t=${COST.passes},p=${COST.parallelism}`;

  const hash = [
    '',
    'argon2id',
    `v=${COST.version}`,
    cost,
    nonce.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$');

  return hash;
}

export async function verifyPassword(
  stored: string,
  password: string,
): Promise<boolean> {
  const [, alg, , cost, nonceB64, keyB64] = stored.split('$');

  const params = Object.fromEntries(
    cost.split(',').map((i) => i.split('=')),
  ) as Record<'m' | 't' | 'p', string>;

  const nonce = Buffer.from(nonceB64, 'base64url');
  const key = Buffer.from(keyB64, 'base64url');

  const derivedKey = await argon2Async(alg as Argon2Algorithm, {
    message: password,
    parallelism: +params.p,
    tagLength: key.length,
    memory: +params.m,
    passes: +params.t,
    nonce,
  });

  return timingSafeEqual(derivedKey, key);
}
