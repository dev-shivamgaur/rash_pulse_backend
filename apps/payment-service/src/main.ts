import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { setupMicroserviceSwagger } from '@rash-pulse/swagger';

import { PaymentServiceModule } from './payment.module';

import cookieParser from "cookie-parser"

async function bootstrap() {
  const app = await NestFactory.create(PaymentServiceModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin:
      configService.get<string>('CORS_ORIGIN') ??
      'http://localhost:8000',
    credentials: true,
  });

  app.use(cookieParser());

  setupMicroserviceSwagger(app, configService, {
    title: 'RashPulse Payment Microservice',
    description: 'Payment endpoints',
    serverUrl: 'http://localhost:8000/api/v1/payments',
  });

  const port = configService.get<number>('PORT') ?? 5004;

  await app.listen(port);

  console.log(
    `📦 Payment Service is running internally on port: ${port}`,
  );

  console.log(
    `📄 Swagger UI   : http://localhost:${port}/docs`,
  );

  console.log(
    `📄 Swagger JSON : http://localhost:${port}/docs-json`,
  );
}

bootstrap();