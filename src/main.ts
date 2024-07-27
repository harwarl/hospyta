import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', 8080);
  console.log(port);

  await app.listen(port);
  Logger.log(`App is running on http://localhost:${port}/${globalPrefix}`);
}
bootstrap();
