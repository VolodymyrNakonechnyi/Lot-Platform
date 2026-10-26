import { z } from 'zod';

export const tokenPairSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().int().positive(),
  refreshToken: z.string(),
});

export type TokenPairResponse = z.infer<typeof tokenPairSchema>;

export const refreshTokenSchema = z.strictObject({
  refreshToken: z.string().min(1, 'refresh_token_required'),
});

export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
