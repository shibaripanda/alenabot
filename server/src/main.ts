import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const PORT = process.env.PORT ?? 5050;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.set('trust proxy', true);
  await app.listen(PORT, () => {
    console.log(`Server GAMEBOT started on port = ${PORT}`);
  });
  process.once('SIGINT', () => void app.close());
  process.once('SIGTERM', () => void app.close());
}
void bootstrap();
