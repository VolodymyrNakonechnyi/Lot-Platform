import type { JobsOptions } from 'bullmq';

export const QUEUE_NAMES = {
  AUTH: 'auth',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const AUTH_JOB_NAMES = {
  SEND_EMAIL_VERIFICATION: 'send-email-verification',
  SEND_PASSWORD_RESET: 'send-password-reset',
} as const;

export type AuthJobName = (typeof AUTH_JOB_NAMES)[keyof typeof AUTH_JOB_NAMES];

export const JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: false,
  removeOnFail: false,
} as const satisfies JobsOptions;
