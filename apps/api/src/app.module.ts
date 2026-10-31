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

@Module({
  imports: [
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
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        },
      }),
    }),
    BullModule.forRootAsync('alternative-config', {
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        },
        prefix: '{alt}',
      }),
    }),
    BullModule.registerQueue({
      configKey: 'alternative-config',
      name: 'video',
    }),
    MailModule.forRootAsync({
      useFactory: () => ({
        // Your provider in production. In development, each email (links
        // included) is printed to the log.
        transport: process.env.SMTP_URL
          ? new SmtpTransport({ url: process.env.SMTP_URL })
          : new LogMailTransport(),
        // The emails' HTML: the templates in mail/templates, next to this file
        templates: new FileTemplateEngine({
          dir: join(__dirname, 'mail/templates'),
        }),
        from: process.env.MAIL_FROM ?? 'Accounts <accounts@example.com>',
      }),
    }),
    AuthenticationModule.forRootAsync({
      useFactory: () => ({
        session: {
          trustedOrigins: process.env.WEB_ORIGIN
            ? [process.env.WEB_ORIGIN]
            : undefined,
          metadata: (request) => ({
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          }),
          absoluteTtl: '14d',
          idleTtl: '3d',
        },
        emailVerification: { url: `${process.env.WEB_ORIGIN}/verify-email` },
        passwordReset: { url: `${process.env.WEB_ORIGIN}/reset-password` },
        magicLink: { url: `${process.env.WEB_ORIGIN}/sign-in/magic` },
        accessToken: {
          key: process.env.JWT_PRIVATE_KEY!, // PEM private key P-256
          alg: 'ES256',
          kid: process.env.JWT_KID!,
          issuer: 'https://api.example.com',
          audience: 'mobile-app',
          ttl: '15m',
        },
        mfa: {
          encryption: { keys: [process.env.TOTP_ENCRYPTION_KEY!] },
          issuer: 'Example',
        },
        oidc: {
          // The callback route of OidcController, registered with Google.
          callbackUrl: `${process.env.APP_URL}/auth/oidc/:provider/callback`,
          providers: {
            google: google({
              clientId: process.env.GOOGLE_CLIENT_ID!,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            }),
          },
        },
      }),
    }),
    AuthModule,
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
