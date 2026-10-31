import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  loginSchema,
  registerSchema,
  type LoginDto,
  type PublicUser,
  type RegisterDto,
  type SignInResponse,
} from '@app/contracts';
import {
  CurrentUser,
  EmailVerificationService,
  Public,
  SignInService,
} from '@nestjs/authentication';
import { ZodSerializerDto } from 'nestjs-zod';
import { PublicUserDto, SignInResponseDto } from './dto/user.dto';
import { CredentialsService } from './credentials.service';
import { hours, minutes, SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly createntialsService: CredentialsService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly signInService: SignInService,
  ) {}

  @SkipThrottle({ account: true })
  @Throttle({ default: { limit: 10, ttl: hours(1) } })
  @Post('sign-up')
  @Public()
  @ZodSerializerDto(SignInResponseDto)
  async register(
    @Body({ schema: registerSchema }) body: RegisterDto,
  ): Promise<SignInResponse> {
    const user = await this.createntialsService.register(
      body.email,
      body.name,
      body.password,
    );

    const { session } = await this.signInService.signIn(user.id, {
      method: 'password',
    });

    // The link in this email proves the customer owns the address.
    await this.emailVerificationService.send(user);
    return { mfaRequired: session.mfa === 'pending' };
  }

  @Throttle({
    default: { limit: 30, ttl: minutes(15) },
    account: { limit: 5, ttl: minutes(15) },
  })
  @Post('sign-in')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SignInResponseDto)
  async login(
    @Body({ schema: loginSchema }) body: LoginDto,
  ): Promise<SignInResponse> {
    const user = await this.createntialsService.verify(
      body.email,
      body.password,
    );

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
