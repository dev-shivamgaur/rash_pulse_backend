import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { VersioningType } from '@nestjs/common';
import { setupGatewaySwagger } from '@rash-pulse/swagger';

import { ApiGatewayModule } from './api-gateway.module';
import { GATEWAY_SERVICE_ROUTES } from './gateway.config';
import { setupGatewayProxies } from './setup-proxy';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(ApiGatewayModule);

  const configService = app.get(ConfigService);

  app.enableCors();

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const gatewayPort = configService.get<number>('PORT') ?? 8000;

  setupGatewaySwagger(app, configService, {
    title: 'RashPulse API Gateway',
    description:
      'Central API documentation — select a service from the dropdown to explore and test its endpoints.',
    serverUrl: `http://localhost:${gatewayPort}`,
    services: GATEWAY_SERVICE_ROUTES.map((route) => ({
      name: route.name,
      url: route.docsJsonPath,
    })),
  });

  setupGatewayProxies(app, configService);

  await app.listen(gatewayPort);

  await NestFactory.createMicroservice<MicroserviceOptions>(ApiGatewayModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'auth_queue',
      queueOptions: { durable: true },
    },
  });

  console.log(`🚀 API Gateway : http://localhost:${gatewayPort}`);
  console.log(`📚 Swagger UI  : http://localhost:${gatewayPort}/api/v1/docs`);

  for (const route of GATEWAY_SERVICE_ROUTES) {
    console.log(
      `   ↳ ${route.name.padEnd(16)} http://localhost:${gatewayPort}${route.gatewayPrefix}`,
    );
  }
}

bootstrap();
