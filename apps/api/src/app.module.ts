import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { UserModule } from './user/user.module';
import { APP_INTERCEPTOR, APP_PIPE, APP_FILTER } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { AuthModule } from './auth/auth.module';
import { AuthenticationModule } from '@nestjs/authentication';
import './auth/authentication.types';

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
    BullModule.registerQueue({
      configKey: 'alternative-config',
      name: 'video',
    }),
    AuthenticationModule.forRoot({
      session: {
        trustedOrigins: process.env.WEB_ORIGIN
          ? [process.env.WEB_ORIGIN]
          : undefined,
        metadata: (request) => ({
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        }),
      },
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
