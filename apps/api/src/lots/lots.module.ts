import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from 'src/common/consts';
import { LotsController } from './lots.controller';
import { LotsService } from './lots.service';
import { LotsQueueProducer } from './queue/lots-queue.producer';
import { LotsProcessor } from './queue/lots.processor';
import { LotsListener } from './queue/lots.listener';
import { OutbidMail } from './mails/outbid.mail';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.LOTS }),
    BullBoardModule.forFeature({
      name: QUEUE_NAMES.LOTS,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [LotsController],
  providers: [
    LotsService,
    LotsQueueProducer,
    LotsProcessor,
    LotsListener,
    OutbidMail,
  ],
})
export class LotsModule {}
