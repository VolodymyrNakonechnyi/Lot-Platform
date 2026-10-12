import { createZodDto } from 'nestjs-zod';
import { loginSchema, publicUserSchema, registerSchema } from '@app/contracts';

export class CreateUserDto extends createZodDto(registerSchema) {}
export class LoginUserDto extends createZodDto(loginSchema) {}
export class PublicUserDto extends createZodDto(publicUserSchema) {}
