import { createZodDto } from 'nestjs-zod';
import {
  publicUserSchema,
  signInResponseSchema,
  verifyEmailResponseSchema,
} from '@app/contracts';

export class PublicUserDto extends createZodDto(publicUserSchema) {}
export class SignInResponseDto extends createZodDto(signInResponseSchema) {}
export class VerifyEmailResponseDto extends createZodDto(
  verifyEmailResponseSchema,
) {}
