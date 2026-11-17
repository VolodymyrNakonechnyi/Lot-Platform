import { cleanupOpenApiDoc } from 'nestjs-zod';
import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyMultipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from './config/types';

async function bootstrap() {
  if (existsSync('.env')) process.loadEnvFile('.env');

  const fastifyAdapter = new FastifyAdapter({ trustProxy: 'loopback' });

  await fastifyAdapter.register(fastifyMultipart, {
    limits: {
      fieldNameSize: 1024,
      fieldSize: 1 * 1024 * 1024,
      fields: 10,
      fileSize: 10 * 1024 * 1024,
      files: 8,
      headerPairs: 2000,
    },
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

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
  app.enableCsrfProtection({ trustedOrigins: [webOrigin] });
  await app.listen(port, '0.0.0.0');

  console.log(`API:     http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/docs`);
}
bootstrap();
