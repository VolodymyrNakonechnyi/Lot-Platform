import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { setupBullBoard } from './setupBullBoard';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        },
      }),
    }),
    setupBullBoard(),
  ],
  exports: [BullModule],
})
export class QueueModule {}
