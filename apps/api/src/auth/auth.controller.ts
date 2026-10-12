import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { PublicUser } from '@app/contracts';
import { ZodSerializerDto } from 'nestjs-zod';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto, PublicUserDto } from './dto/user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ZodSerializerDto(PublicUserDto)
  register(@Body() dto: CreateUserDto): Promise<PublicUser> {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(PublicUserDto)
  login(@Body() dto: LoginUserDto): Promise<PublicUser> {
    return this.auth.login(dto);
  }
}
