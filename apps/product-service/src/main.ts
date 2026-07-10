import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { setupMicroserviceSwagger } from '@rash-pulse/swagger';

import { ProductServiceModule } from './product-service.module';
// import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(ProductServiceModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin:
      configService.get<string>('CORS_ORIGIN') ??
      'http://localhost:8000',
    credentials: true,
  });

  setupMicroserviceSwagger(app, configService, {
    title: 'RashPulse Product Microservice',
    description: 'Product catalog aur inventory endpoints',
    serverUrl: 'http://localhost:8000/api/v1/products',
  });

  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.RMQ,
  //   options: {
  //     urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
  //     queue: 'products_queue', // Products service ki apni queue
  //     queueOptions: { durable: true },
  //   },
  // });

  // await app.startAllMicroservices();

  const port = configService.get<number>('PORT') ?? 5003;

  await app.listen(port);

  console.log(
    `📦 Product Service is running internally on port: ${port}`,
  );

  console.log(
    `📄 Swagger UI   : http://localhost:${port}/docs`,
  );

  console.log(
    `📄 Swagger JSON : http://localhost:${port}/docs-json`,
  );
}

bootstrap();