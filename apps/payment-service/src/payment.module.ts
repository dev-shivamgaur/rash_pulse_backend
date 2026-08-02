import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentServiceController,  } from './payment.controller';
import { PaymentService, } from './payment.service';
import { RedisPaymentModule } from './common/redis/redis.module';
import { PaymentMQModule } from './common/rabbitmq/rabbitmq.module';
import { JwtSharedModule } from 'libs/jwt-shared/src';
import { PrismaModule } from './common/prisma/prisma.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/payment-service/.env',
    }),
    RedisPaymentModule,
    JwtSharedModule,
    PrismaModule,
     forwardRef(()=>PaymentMQModule) 
  ],
  controllers: [PaymentServiceController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentServiceModule {}
