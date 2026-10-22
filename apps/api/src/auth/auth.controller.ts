import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import type { PublicUser, SignInResponse } from '@app/contracts';
import {
  CurrentUser,
  EmailVerificationService,
  Public,
  SignInService,
} from '@nestjs/authentication';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  CreateUserDto,
  LoginUserDto,
  PublicUserDto,
  SignInResponseDto,
} from './dto/user.dto';
import { CredentialsService } from './credentials.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly createntialsService: CredentialsService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly signInService: SignInService,
  ) {}

  @Post('sign-up')
  @Public()
  @ZodSerializerDto(SignInResponseDto)
  async register(@Body() dto: CreateUserDto): Promise<PublicUser> {
    const user = await this.createntialsService.register(
      dto.email,
      dto.name,
      dto.password,
    );

    await this.signInService.signIn(user.id, { method: 'password' });

    // The link in this email proves the customer owns the address.
    await this.emailVerificationService.send(user);
    return user;
  }

  @Post('sign-in')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SignInResponseDto)
  async login(@Body() dto: LoginUserDto): Promise<SignInResponse> {
    const user = await this.createntialsService.verify(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { session } = await this.signInService.signIn(user.id, {
      method: 'password',
    });
    return { mfaRequired: session.mfa === 'pending' };
  }

  @Get('me')
  @ZodSerializerDto(PublicUserDto)
  me(@CurrentUser() user: PublicUser): PublicUser {
    return user;
  }

  @Post('sign-out')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(): Promise<void> {
    if (!(await this.signInService.signOut())) {
      throw new UnauthorizedException();
    }
  }
}
