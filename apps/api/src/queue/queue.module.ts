import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/types';
import { setupBullBoard } from './setupBullBoard';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        connection: config.get('redis', { infer: true }),
      }),
    }),
    setupBullBoard(),
  ],
  exports: [BullModule],
})
export class QueueModule {}
