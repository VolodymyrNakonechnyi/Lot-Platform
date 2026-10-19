import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import type { PublicUser } from '@app/contracts';
import { CurrentUser, Public, SignInService } from '@nestjs/authentication';
import { ZodSerializerDto } from 'nestjs-zod';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto, PublicUserDto } from './dto/user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly signInService: SignInService,
  ) {}

  @Post('register')
  @Public()
  @ZodSerializerDto(PublicUserDto)
  register(@Body() dto: CreateUserDto): Promise<PublicUser> {
    return this.auth.register(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(PublicUserDto)
  async login(@Body() dto: LoginUserDto): Promise<PublicUser> {
    const user = await this.auth.login(dto);
    await this.signInService.signIn(user.id);
    return user;
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
