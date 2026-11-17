import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from 'src/common/consts';
import { LotsController } from './lots.controller';
import { LotsService } from './lots.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.LOTS }),
    BullBoardModule.forFeature({
      name: QUEUE_NAMES.LOTS,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [LotsController],
  providers: [LotsService],
})
export class LotsModule {}
