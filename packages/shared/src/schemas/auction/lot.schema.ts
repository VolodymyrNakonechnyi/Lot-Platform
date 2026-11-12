import { z } from 'zod';

export const lotId = z.uuid();

export const lotIdParamSchema = z.strictObject({
  id: lotId,
});

export type LotIdParamDto = z.infer<typeof lotIdParamSchema>;
