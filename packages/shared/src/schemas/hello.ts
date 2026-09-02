import { z } from 'zod';

export const helloSchema = z.object({
  message: z.string(),
});

export type Hello = z.infer<typeof helloSchema>;
