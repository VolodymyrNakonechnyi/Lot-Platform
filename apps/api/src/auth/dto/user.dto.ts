import { createZodDto } from 'nestjs-zod';
import { registerSchema } from '@app/contracts';

export class CreateUserDto extends createZodDto(registerSchema) {}
