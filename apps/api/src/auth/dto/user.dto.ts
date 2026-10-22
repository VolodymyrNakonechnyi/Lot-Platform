import { createZodDto } from 'nestjs-zod';
import {
  loginSchema,
  publicUserSchema,
  registerSchema,
  signInResponseSchema,
  verifyEmailResponseSchema,
} from '@app/contracts';

export class CreateUserDto extends createZodDto(registerSchema) {}
export class LoginUserDto extends createZodDto(loginSchema) {}
export class PublicUserDto extends createZodDto(publicUserSchema) {}
export class SignInResponseDto extends createZodDto(signInResponseSchema) {}
export class VerifyEmailResponseDto extends createZodDto(
  verifyEmailResponseSchema,
) {}
