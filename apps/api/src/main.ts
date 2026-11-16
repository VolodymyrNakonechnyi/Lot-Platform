import { cleanupOpenApiDoc } from 'nestjs-zod';
import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from './config/types';

async function bootstrap() {
  if (existsSync('.env')) process.loadEnvFile('.env');

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Example API')
      .setDescription('Example API description')
      .setVersion('1.0')
      .build(),
  );

  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(openApiDoc));
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const webOrigin = config.get('webOrigin', { infer: true });
  const port = config.get('port', { infer: true });

  app.enableShutdownHooks();
  app.enableCors({ origin: webOrigin, credentials: true });
  app.set('trust proxy', 'loopback');
  app.enableCsrfProtection({ trustedOrigins: [webOrigin] });
  await app.listen(port);

  console.log(`API:     http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/docs`);
}
bootstrap();
