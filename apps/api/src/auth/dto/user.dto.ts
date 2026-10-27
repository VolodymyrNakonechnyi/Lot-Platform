import { createZodDto } from 'nestjs-zod';
import {
  emailSchema,
  loginSchema,
  publicUserSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  signInResponseSchema,
  tokenPairSchema,
  verifyEmailResponseSchema,
  verifyEmailSchema,
} from '@app/contracts';

export class CreateUserDto extends createZodDto(registerSchema) {}
export class LoginUserDto extends createZodDto(loginSchema) {}
export class PublicUserDto extends createZodDto(publicUserSchema) {}
export class SignInResponseDto extends createZodDto(signInResponseSchema) {}
export class VerifyEmailResponseDto extends createZodDto(
  verifyEmailResponseSchema,
) {}
export class VerifyEmailDto extends createZodDto(verifyEmailSchema) {}
export class EmailDto extends createZodDto(emailSchema) {}
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}
export class TokenPairDto extends createZodDto(tokenPairSchema) {}
