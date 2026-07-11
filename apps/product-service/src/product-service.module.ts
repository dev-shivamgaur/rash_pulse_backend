import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductServiceController } from './product-service.controller';
import { ProductService } from './product-service.service';
import { RedisProductModule } from './common/redis/redis.module';
import { ProductMQModule } from './common/rabbitmq/rabbitmq.module';
import { JwtSharedModule } from 'libs/jwt-shared/src';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/product-service/.env',
    }),
    RedisProductModule,
    JwtSharedModule,
     forwardRef(()=>ProductMQModule) 
  ],
  controllers: [ProductServiceController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductServiceModule {}
