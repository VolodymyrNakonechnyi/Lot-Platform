import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import { PasswordResetService, Public } from '@nestjs/authentication';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  emailSchema,
  resetPasswordSchema,
  type EmailDto,
  type ResetPasswordDto,
  type SignInResponse,
} from '@app/contracts';
import { SignInResponseDto } from './dto/user.dto';
import { minutes, Throttle } from '@nestjs/throttler';
import { accountEmail } from './account-email';

@Public()
@Controller('auth/password')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  // The same answer, as fast, whether or not the address has an account:
  // request() returns before it looks the address up.
  @Throttle({
    default: { limit: 10, ttl: minutes(15) },
    account: { limit: 3, ttl: minutes(15), getTracker: accountEmail },
  })
  @Post('forgot')
  @HttpCode(202)
  forgot(@Body({ schema: emailSchema }) body: EmailDto) {
    this.passwordResetService.request(body.email);
  }

  // Called by the page the link opens, with the token from its URL and the new password.
  @Post('reset')
  @HttpCode(200)
  @ZodSerializerDto(SignInResponseDto)
  async reset(
    @Body({ schema: resetPasswordSchema }) body: ResetPasswordDto,
  ): Promise<SignInResponse> {
    const result = await this.passwordResetService.reset(
      body.token,
      body.password,
      { signIn: true },
    );
    if (!result) {
      throw new BadRequestException('Invalid or expired link');
    }
    return { mfaRequired: result.signedIn?.session.mfa === 'pending' };
  }
}
