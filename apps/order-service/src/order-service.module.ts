import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrderServiceController } from './order-service.controller';
import { OrderService } from './order-service.service';
import { RabbitMQModule } from './common/rabbitmq/rabbitmq.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/order-service/.env',
    }),
    PrismaModule,
    forwardRef(()=> RabbitMQModule,
  ) 
  ],
  controllers: [OrderServiceController],
  providers: [OrderService],
  exports: [OrderService]
})
export class OrderServiceModule {}
