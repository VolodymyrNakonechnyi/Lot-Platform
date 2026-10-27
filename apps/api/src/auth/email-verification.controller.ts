import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import {
  CurrentUser,
  EmailVerificationService,
  Public,
} from '@nestjs/authentication';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  verifyEmailSchema,
  type VerifyEmailDto,
  type VerifyEmailResponse,
} from '@app/contracts';
import { VerifyEmailResponseDto } from './dto/user.dto';
import type { User } from 'src/db/schema';

@Controller('auth/email')
export class EmailVerificationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Public()
  @Post('verify')
  @HttpCode(200)
  @ZodSerializerDto(VerifyEmailResponseDto)
  async verify(
    @Body({ schema: verifyEmailSchema }) body: VerifyEmailDto,
  ): Promise<VerifyEmailResponse> {
    const verified = await this.emailVerificationService.verify(body.token);
    if (!verified) {
      throw new BadRequestException('Invalid or expired link');
    }
    return { email: verified.email, emailVerified: true };
  }

  @Post('verification')
  @HttpCode(202)
  async resend(@CurrentUser() user: User) {
    if (user.confirmedEmail) {
      throw new ConflictException('Email address already verified');
    }
    await this.emailVerificationService.send(user);
  }
}
