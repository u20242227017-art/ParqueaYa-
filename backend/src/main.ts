import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const frontendRoot = resolve(process.cwd(), '..');
  app.useStaticAssets(resolve(frontendRoot, 'Imagenes'), {
    prefix: '/Imagenes',
  });
  app.useStaticAssets(resolve(frontendRoot, 'estilos'), {
    prefix: '/estilos',
  });
  app.useStaticAssets(resolve(frontendRoot, 'scripts'), {
    prefix: '/scripts',
  });
  app.useStaticAssets(resolve(frontendRoot, 'templates'), {
    prefix: '/templates',
  });
  app.getHttpAdapter().get(
    '/',
    (_request, response) => {
      app.getHttpAdapter().setHeader(
        response,
        'Content-Type',
        'text/html; charset=utf-8',
      );
      app
        .getHttpAdapter()
        .reply(
          response,
          readFileSync(resolve(frontendRoot, 'index.html'), 'utf8'),
          200,
        );
    },
  );

  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }
  await app.listen(port);
}
void bootstrap();
