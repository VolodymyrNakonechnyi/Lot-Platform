import { BullModule } from '@nestjs/bullmq';
import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { UserModule } from './user/user.module';
import { APP_INTERCEPTOR, APP_PIPE, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ZodSerializerInterceptor } from 'nestjs-zod';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { AuthModule } from './auth/auth.module';
import { AuthenticationModule, google } from '@nestjs/authentication';
import './auth/authentication.types';
import {
  FileTemplateEngine,
  LogMailTransport,
  MailModule,
  SmtpTransport,
} from '@nestjs/mail';
import { join } from 'node:path';
import { ThrottlerGuard, ThrottlerModule, minutes } from '@nestjs/throttler';
import { accountEmailAndIp, skipWithoutAccount } from './auth/account-email';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { QueueModule } from './queue/queue.module';
import { LotsModule } from './lots/lots.module';
import { CategoriesModule } from './categories/categories.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from './config/config';
import type { AppConfig } from './config/types';
import { validateEnv } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [config],
      validate: validateEnv,
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
    }),
    DbModule,
    UserModule,
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'default', limit: 300, ttl: minutes(1) },
        {
          name: 'account',
          limit: 5,
          ttl: minutes(15),
          getTracker: accountEmailAndIp,
          skipIf: skipWithoutAccount,
        },
      ],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        connection: config.get('redis', { infer: true }),
      }),
    }),
    MailModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const mail = config.get('mail', { infer: true });

        return {
          transport: mail.smtpUrl
            ? new SmtpTransport({ url: mail.smtpUrl })
            : new LogMailTransport(),
          templates: new FileTemplateEngine({
            dir: join(__dirname, 'mail/templates'),
          }),
          from: mail.from,
        };
      },
    }),
    AuthenticationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const appUrl = config.get('appUrl', { infer: true });
        const webOrigin = config.get('webOrigin', { infer: true });
        const jwt = config.get('jwt', { infer: true });
        const oauth = config.get('google', { infer: true });

        return {
          session: {
            trustedOrigins: [webOrigin],
            metadata: (request) => ({
              ip: request.ip,
              userAgent: request.headers['user-agent'],
            }),
            absoluteTtl: '14d',
            idleTtl: '3d',
          },
          emailVerification: { url: `${webOrigin}/verify-email` },
          passwordReset: { url: `${webOrigin}/reset-password` },
          magicLink: { url: `${webOrigin}/sign-in/magic` },
          accessToken: {
            key: jwt.privateKey,
            alg: 'ES256',
            kid: jwt.kid,
            issuer: appUrl,
            audience: 'mobile-app',
            ttl: '15m',
          },
          mfa: {
            encryption: {
              keys: [config.get('mfa.totpEncryptionKey', { infer: true })],
            },
            issuer: 'Example',
          },
          oidc: {
            callbackUrl: `${appUrl}/auth/oidc/:provider/callback`,
            providers: {
              google: google({
                clientId: oauth.clientId!,
                clientSecret: oauth.clientSecret!,
              }),
            },
          },
        };
      },
    }),
    AuthModule,
    QueueModule,
    LotsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_PIPE,
      useClass: StandardSchemaValidationPipe,
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
