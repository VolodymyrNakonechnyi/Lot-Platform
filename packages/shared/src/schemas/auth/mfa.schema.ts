import { z } from 'zod';

export const mfaCode = z
  .string()
  .trim()
  .overwrite((v) => v.replace(/\s+/g, ''))
  .regex(/^\d{6}$/, 'invalid_code');

export const mfaRecoveryCode = z
  .string()
  .trim()
  .min(1, 'invalid_recovery_code');

export const mfaConfirmSchema = z.strictObject({
  code: mfaCode,
});

export type MfaConfirmDto = z.infer<typeof mfaConfirmSchema>;

export const mfaVerifySchema = z
  .strictObject({
    code: mfaCode.optional(),
    recoveryCode: mfaRecoveryCode.optional(),
  })
  .refine((body) => Boolean(body.code ?? body.recoveryCode), {
    message: 'code_required',
  });

export type MfaVerifyDto = z.infer<typeof mfaVerifySchema>;
