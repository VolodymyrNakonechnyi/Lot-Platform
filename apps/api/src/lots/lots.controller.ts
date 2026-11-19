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
  UseGuards,
} from '@nestjs/common';
import {
  createLotSchema,
  lotIdParamSchema,
  placeBidSchema,
  updateLotSchema,
  type CreateLotDto,
  type LotDetailsRow,
  type LotIdParamDto,
  type PlaceBidDto,
  type PublicUser,
  type UpdateLotDto,
} from '@app/contracts';
import { Authenticate, CurrentUser, Public } from '@nestjs/authentication';
import { ZodSerializerDto } from 'nestjs-zod';
import { SkipThrottle } from '@nestjs/throttler';
import { LotsService } from './lots.service';
import { AdminGuard } from '../common/guards/admin.guard';
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

  @Post(':id/submit')
  @Authenticate()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(LotDetailsDto)
  async submitLot(
    @Param({ schema: lotIdParamSchema }) { id }: LotIdParamDto,
    @CurrentUser() user: PublicUser,
  ): Promise<LotDetailsRow> {
    return await this.lotsService.submitLot(id, user);
  }

  @Post(':id/cancel')
  @Authenticate()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(LotDetailsDto)
  async cancelLot(
    @Param({ schema: lotIdParamSchema }) { id }: LotIdParamDto,
    @CurrentUser() user: PublicUser,
  ): Promise<LotDetailsRow> {
    return await this.lotsService.cancelLot(id, user);
  }

  @Post(':id/approve')
  @Authenticate()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(LotDetailsDto)
  async approveLot(
    @Param({ schema: lotIdParamSchema }) { id }: LotIdParamDto,
  ): Promise<LotDetailsRow> {
    return await this.lotsService.approveLot(id);
  }

  @Post(':id/reject')
  @Authenticate()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(LotDetailsDto)
  async rejectLot(
    @Param({ schema: lotIdParamSchema }) { id }: LotIdParamDto,
  ): Promise<LotDetailsRow> {
    return await this.lotsService.rejectLot(id);
  }

  @Post(':id/block')
  @Authenticate()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(LotDetailsDto)
  async blockLot(
    @Param({ schema: lotIdParamSchema }) { id }: LotIdParamDto,
  ): Promise<LotDetailsRow> {
    return await this.lotsService.blockLot(id);
  }

  @Post(':id/unblock')
  @Authenticate()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(LotDetailsDto)
  async unblockLot(
    @Param({ schema: lotIdParamSchema }) { id }: LotIdParamDto,
  ): Promise<LotDetailsRow> {
    return await this.lotsService.unblockLot(id);
  }

  @Post(':id/bids')
  @Authenticate()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(LotDetailsDto)
  async placeBid(
    @Param({ schema: lotIdParamSchema }) { id }: LotIdParamDto,
    @CurrentUser('id') userId: string,
    @Body({ schema: placeBidSchema }) body: PlaceBidDto,
  ): Promise<LotDetailsRow> {
    return await this.lotsService.placeBid(id, userId, body.amount);
  }
}
