import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import {
  createLotSchema,
  lotIdParamSchema,
  type CreateLotDto,
  type LotDetailsRow,
  type LotIdParamDto,
} from '@app/contracts';
import { Authenticate, CurrentUser, Public } from '@nestjs/authentication';
import { ZodSerializerDto } from 'nestjs-zod';
import { LotsService } from './lots.service';
import { LotDetailsDto } from './dto/lot.dto';

@Controller('lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Get(':id')
  @Public()
  @ZodSerializerDto(LotDetailsDto)
  async getLot(
    @Param({ schema: lotIdParamSchema }) { id }: LotIdParamDto,
  ): Promise<LotDetailsRow> {
    const lot = await this.lotsService.getLot(id);

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    return lot;
  }

  @Post()
  @Authenticate()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(LotDetailsDto)
  async createLot(
    @CurrentUser('id') sellerId: string,
    @Body({ schema: createLotSchema }) body: CreateLotDto,
  ): Promise<LotDetailsRow> {
    return await this.lotsService.createLot(sellerId, body);
  }
}
