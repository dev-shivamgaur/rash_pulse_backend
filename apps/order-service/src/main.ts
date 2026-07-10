import * as dotenv from 'dotenv';
import * as path from 'path';

// 🛑 CRITICAL FIX: NestJS App create hone se PEHLE hi env file load kar lo
dotenv.config({ path: path.resolve(process.cwd(), 'apps/order-service/.env') });

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { setupMicroserviceSwagger } from '@rash-pulse/swagger';

import { OrderServiceModule } from './order-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // Ab NestJS jab create hoga, usko PORT=5002 pehle se ready milega
  const app = await NestFactory.create(OrderServiceModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin:
      configService.get<string>('CORS_ORIGIN') ??
      'http://localhost:8000',
    credentials: true,
  });

  setupMicroserviceSwagger(app, configService, {
    title: 'RashPulse Order Microservice',
    description: 'Order placement aur tracking endpoints',
    serverUrl: 'http://localhost:8000/api/v1/orders',
  });

  // Agar PORT env me nahi mila, tab fallback 5002 par rakhein (5003 par nahi)
  const port = configService.get<number>('PORT') ?? 5002;

  await app.listen(port);

  console.log(`🛒 Order Service is running on: http://localhost:${port}`);
  console.log(`📄 Swagger UI   : http://localhost:${port}/docs`);
  console.log(`📄 Swagger JSON : http://localhost:${port}/docs-json`);
}

bootstrap();