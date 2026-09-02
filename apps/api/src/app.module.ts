import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    DbModule,
    UserModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullModule.forRoot('alternative-config', {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
      prefix: '{alt}',
    }),
    BullModule.registerQueue({ configKey: 'alternative-config', name: 'video' }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
