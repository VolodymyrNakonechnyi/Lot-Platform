export const QUEUE_NAMES = {
  USER: 'user',
  AUTH: 'auth',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
