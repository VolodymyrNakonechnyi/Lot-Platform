import { z } from 'zod';
import { ROLES } from '../../enums.js';

const emailSchema = z
	.string()
	.trim()
	.toLowerCase()
	.pipe(z.email({ message: 'invalid_email' }))
	.pipe(z.string().max(254));

const nameSchema = z
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
	email: z.email(),
	confirmedEmail: z.boolean(),
	name: z.string(),
	phoneNumber: z.string().nullable(),
	confirmedPhoneNumber: z.boolean(),
	updatedAt: z.date(),
	createdAt: z.date(),
	lastLogin: z.date().nullable(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;
