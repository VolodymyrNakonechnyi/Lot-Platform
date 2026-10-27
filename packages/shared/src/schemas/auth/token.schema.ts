import { z } from 'zod';
import { mfaCode, mfaRecoveryCode } from './mfa.schema.js';
import { loginSchema } from './user.schema.js';

export const tokenPairSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().int().positive(),
  refreshToken: z.string(),
});

export type TokenPairResponse = z.infer<typeof tokenPairSchema>;

export const refreshTokenSchema = z.strictObject({
  refreshToken: z.string().min(1, 'refresh_token_required'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export const tokenRequestSchema = loginSchema.extend({
  code: mfaCode.optional(),
  recoveryCode: mfaRecoveryCode.optional(),
});

export type TokenRequestDto = z.infer<typeof tokenRequestSchema>;
