import type { ExecutionContext } from '@nestjs/common';
import {
  normalizeIp,
  type ThrottlerGetTrackerFunction,
} from '@nestjs/throttler';

function emailOf(request: Record<string, any>): string | undefined {
  const email: unknown = (request.body as { email?: unknown } | undefined)
    ?.email;
  if (typeof email !== 'string') {
    return undefined;
  }
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

export const accountEmail: ThrottlerGetTrackerFunction = (request) =>
  emailOf(request) ??
  normalizeIp(typeof request.ip === 'string' ? request.ip : '');

export const accountEmailAndIp: ThrottlerGetTrackerFunction = (request) => {
  const ip = normalizeIp(typeof request.ip === 'string' ? request.ip : '');
  return `${emailOf(request) ?? ip}-${ip}`;
};

export const skipWithoutAccount = (context: ExecutionContext): boolean =>
  context.getType() !== 'http' ||
  emailOf(context.switchToHttp().getRequest()) === undefined;
