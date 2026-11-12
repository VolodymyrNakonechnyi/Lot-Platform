import { Controller, Get, Param } from '@nestjs/common';
import { lotIdParamSchema, type LotIdParamDto } from '@app/contracts';
import { LotsService } from './lots.service';
import { Public } from '@nestjs/authentication';

@Controller('lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Get(':id')
  @Public()
  async getLot(@Param({ schema: lotIdParamSchema }) { id }: LotIdParamDto) {
    return await this.lotsService.getLot(id);
  }
}
