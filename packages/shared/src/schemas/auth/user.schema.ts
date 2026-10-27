import { z } from 'zod';
import { ROLES } from '../../enums.js';
import { normalizeEmail } from '../../normalize.js';

export const email = z
  .string()
  .trim()
  .pipe(z.email({ message: 'invalid_email' }).max(254, 'email_too_long'))
  .transform(normalizeEmail);

export const name = z
  .string()
  .trim()
  .overwrite((v) => v.replace(/\s+/g, ' '))
  .min(1, 'name_required')
  .max(100);

const password = z
  .string()
  .min(8, 'password_too_short')
  .max(128, 'password_too_long')
  .regex(/[a-zA-Z]/, { message: 'password_needs_letter' })
  .regex(/[0-9]/, { message: 'password_needs_digit' });

export const emailSchema = z.strictObject({
  email: email,
});

export type EmailDto = z.infer<typeof emailSchema>;

export const resetPasswordSchema = z.strictObject({
  token: z.string().min(1, 'token_required'),
  password: password,
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export const loginSchema = z.strictObject({
  email: email,
  password: z.string().min(1, 'password_required'),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const registerSchema = z.strictObject({
  email: email,
  password: password,
  name: name,
});

export type RegisterDto = z.infer<typeof registerSchema>;

export const publicUserSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  role: z.enum(ROLES),
  email: email,
  confirmedEmail: z.boolean(),
  name: z.string(),
  phoneNumber: z.string().nullable(),
  confirmedPhoneNumber: z.boolean(),
  updatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  lastLogin: z.coerce.date().nullable(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;

export const signInResponseSchema = z.object({
  mfaRequired: z.boolean(),
});

export type SignInResponse = z.infer<typeof signInResponseSchema>;

export const verifyEmailSchema = z.strictObject({
  token: z.string().min(1, 'token_required'),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;

export const verifyEmailResponseSchema = z.object({
  email: email,
  emailVerified: z.boolean(),
});

export type VerifyEmailResponse = z.infer<typeof verifyEmailResponseSchema>;
