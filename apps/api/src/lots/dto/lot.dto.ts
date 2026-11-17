import { createZodDto } from 'nestjs-zod';
import { lotDetailsSchema } from '@app/contracts';

export class LotDetailsDto extends createZodDto(lotDetailsSchema) {}
