import {
  Body,
  ConflictException,
  Controller,
  Get,
  Patch,
} from '@nestjs/common';
import {
  Authenticate,
  CurrentUser,
  EmailVerificationService,
} from '@nestjs/authentication';
import { EmailDto, PublicUserDto } from 'src/auth/dto/user.dto.js';
import { UserService } from './user.service';
import { ZodSerializerDto } from 'nestjs-zod';

@Controller('me')
export class MeController {
  constructor(
    private readonly usersService: UserService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Get()
  @ZodSerializerDto(PublicUserDto)
  me(@CurrentUser() user: PublicUserDto) {
    return user;
  }

  // The email address is how an account is recovered: changing it needs a
  // session (or token) that passed the second factor.
  @Authenticate({ mfa: true })
  @Patch('email')
  async changeEmail(@CurrentUser('id') userId: string, @Body() body: EmailDto) {
    if (await this.usersService.findByEmail(body.email)) {
      throw new ConflictException('Email already registered');
    }
    const user = await this.usersService.updateEmail(userId, body.email);

    if (user) {
      // The new address is unverified until the customer uses this link.
      await this.emailVerificationService.send({
        id: user.id,
        email: user.email,
      });
    }
    return user;
  }
}
