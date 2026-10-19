import { cleanupOpenApiDoc } from 'nestjs-zod';
import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  if (existsSync('.env')) process.loadEnvFile('.env');

  const app = await NestFactory.create(AppModule);

  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Example API')
      .setDescription('Example API description')
      .setVersion('1.0')
      .build(),
  );

  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(openApiDoc));
  app.enableShutdownHooks();
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? true, credentials: true });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API:     http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/docs`);
}
bootstrap();
