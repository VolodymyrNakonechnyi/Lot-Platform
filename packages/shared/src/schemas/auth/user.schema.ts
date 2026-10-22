import { z } from 'zod';
import { ROLES } from '../../enums.js';
import { normalizeEmail } from '../../normalize.js';

export const emailSchema = z
  .string()
  .trim()
  .pipe(z.email({ message: 'invalid_email' }).max(254, 'email_too_long'))
  .transform(normalizeEmail);

export const nameSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, ' '))
  .pipe(z.string().min(1, 'name_required').max(100));

const passwordSchema = z
  .string()
  .min(8, 'password_too_short')
  .max(128, 'password_too_long')
  .regex(/[a-zA-Z]/, { message: 'password_needs_letter' })
  .regex(/[0-9]/, { message: 'password_needs_digit' });

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.strictObject({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

export type RegisterRequest = z.infer<typeof registerSchema>;

export const publicUserSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  role: z.enum(ROLES),
  email: emailSchema,
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

export const verifyEmailResponseSchema = z.object({
  email: emailSchema,
  emailVerified: z.boolean(),
});

export type VerifyEmailResponse = z.infer<typeof verifyEmailResponseSchema>;
