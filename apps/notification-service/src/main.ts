import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module';
import { ConfigService } from '@nestjs/config';

import cookieParser from 'cookie-parser'
import { setupMicroserviceSwagger } from '@rash-pulse/swagger';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin:
    configService.get<string>('CORS_ORIGIN') ??
    'http://localhost:8000',
    credentials: true,
  });

  app.use(cookieParser());

  setupMicroserviceSwagger(app, configService, {
    title: 'RashPulse Notification Microservice',
    description: 'Notification endpoints',
    serverUrl: 'http://localhost:8000/api/v1/notifications',
  });

  const port = configService.get<number>('PORT') ?? 5004;

  await app.listen(port);

  
  console.log(
    `📦 Notification Service is running internally on port: ${port}`,
  );

  console.log(
    `📄 Swagger UI   : http://localhost:${port}/docs`,
  );

  console.log(
    `📄 Swagger JSON : http://localhost:${port}/docs-json`,
  );
}
bootstrap();
