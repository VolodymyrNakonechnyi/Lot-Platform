import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { UserService } from './user.service';
import { QUEUE_NAMES } from 'src/common/consts';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.USER }),
    BullBoardModule.forFeature({
      name: QUEUE_NAMES.USER,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [MeController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
