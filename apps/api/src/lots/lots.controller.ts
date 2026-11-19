import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  createLotSchema,
  lotIdParamSchema,
  updateLotSchema,
  type CreateLotDto,
  type LotDetailsRow,
  type LotIdParamDto,
  type PublicUser,
  type UpdateLotDto,
} from '@app/contracts';
import { Authenticate, CurrentUser, Public } from '@nestjs/authentication';
import { ZodSerializerDto } from 'nestjs-zod';
import { SkipThrottle } from '@nestjs/throttler';
import { LotsService } from './lots.service';
import { LotDetailsDto } from './dto/lot.dto';

@SkipThrottle()
@Controller('lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Get(':id')
  @Public()
  @ZodSerializerDto(LotDetailsDto)
  async getLot(
    @Param({ schema: lotIdParamSchema }) { id }: LotIdParamDto,
  ): Promise<LotDetailsRow> {
    return await this.lotsService.getLotById(id);
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

  @Put(':id')
  @Authenticate()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(LotDetailsDto)
  async updateLot(
    @Param({ schema: lotIdParamSchema }) { id }: LotIdParamDto,
    @CurrentUser() user: PublicUser,
    @Body({ schema: updateLotSchema }) body: UpdateLotDto,
  ): Promise<LotDetailsRow> {
    return await this.lotsService.updateLot(id, user, body);
  }

  @Delete(':id')
  @Authenticate()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLot(
    @Param({ schema: lotIdParamSchema }) { id }: LotIdParamDto,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.lotsService.deleteLot(id, user);
  }
}
