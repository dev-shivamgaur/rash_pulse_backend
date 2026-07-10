import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { ConfigModule } from '@nestjs/config';
import { RedisGatewayModule } from './common/redis/redis.module';
// import { GatewayAuthGuard } from './guard/gateway-auth.guard';
import { RabbitMQModule } from './common/rabbitmq/rabbitmq.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: 'apps/api-gateway/.env',
  }),
  RedisGatewayModule,
  RabbitMQModule
],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {
  
}
