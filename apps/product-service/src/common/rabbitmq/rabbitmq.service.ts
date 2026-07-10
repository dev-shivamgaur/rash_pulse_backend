import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import amqp, { Channel, ChannelModel } from 'amqplib';
import { ProductService } from '../../product-service.service';


@Injectable()
export class ProductConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProductConsumerService.name);
  private connection: ChannelModel;
  private channel: Channel;

  private readonly RABBITMQ_URL = 'amqp://localhost:5672';
  private readonly EXCHANGE_NAME = 'flash_sale_exchange';
  private readonly QUEUE_NAME = 'products_pricing_queue';

  constructor(private readonly productService: ProductService) {}

  async onModuleInit() {
    await this.initConsumer();
  }

  private async initConsumer() {
    try {
      this.connection = await amqp.connect(this.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.EXCHANGE_NAME, 'fanout', { durable: true });
      await this.channel.assertQueue(this.QUEUE_NAME, { durable: true });
      await this.channel.bindQueue(this.QUEUE_NAME, this.EXCHANGE_NAME, '');

      this.logger.log(`📥 Products Pricing Engine listening on [${this.QUEUE_NAME}]`);

      await this.channel.consume(this.QUEUE_NAME, async (msg) => {
        if (!msg) return;

        try {
          const payload = JSON.parse(msg.content.toString());
          
          // 👉 Call service logic which handles Redis operations
          await this.productService.handleDynamicPricingUpdate({ productId: payload.productId });

          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`🔴 Error inside Consumer pricing thread: ${error.message}`);
          this.channel.nack(msg, false, true);
        }
      });
    } catch (error) {
      this.logger.error(`🔴 Products RabbitMQ connection failed: ${error.message}`);
      setTimeout(() => this.initConsumer(), 5000);
    }
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}