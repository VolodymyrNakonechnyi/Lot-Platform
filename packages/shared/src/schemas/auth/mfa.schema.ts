import { z } from 'zod';

const code = z
  .string()
  .trim()
  .overwrite((v) => v.replace(/\s+/g, ''))
  .regex(/^\d{6}$/, 'invalid_code');

const recoveryCode = z.string().trim().min(1, 'invalid_recovery_code');

export const mfaConfirmSchema = z.strictObject({
  code: code,
});

export type MfaConfirmDto = z.infer<typeof mfaConfirmSchema>;

export const mfaVerifySchema = z
  .strictObject({
    code: code.optional(),
    recoveryCode: recoveryCode.optional(),
  })
  .refine((body) => Boolean(body.code ?? body.recoveryCode), {
    message: 'code_required',
  });

export type MfaVerifyDto = z.infer<typeof mfaVerifySchema>;
