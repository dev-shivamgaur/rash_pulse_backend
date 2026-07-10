import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import amqp, { Channel, ChannelModel } from 'amqplib';
import { OrderService } from 'apps/order-service/src/order-service.service';

@Injectable()
export class OrderConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderConsumerService.name);
  private connection: ChannelModel;
  private channel: Channel;

  private readonly RABBITMQ_URL = 'amqp://localhost:5672';
  private readonly EXCHANGE_NAME = 'flash_sale_exchange';
  private readonly QUEUE_NAME = 'orders_processing_queue';

  constructor(private readonly orderService: OrderService) {}

  async onModuleInit() {
    await this.initConsumer();
  }

  private async initConsumer() {
    try {
      this.connection = await amqp.connect(this.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      // Ensure exchange exists safely (Fanout Type)
      await this.channel.assertExchange(this.EXCHANGE_NAME, 'fanout', { durable: true });

      // Ensure Orders personal queue exists
      await this.channel.assertQueue(this.QUEUE_NAME, { durable: true });

      // Bind queue to Fanout Exchange (Routing key is empty string '')
      await this.channel.bindQueue(this.QUEUE_NAME, this.EXCHANGE_NAME, '');

      this.logger.log(`📥 Orders Consumer connected and listening on [${this.QUEUE_NAME}]`);

      await this.channel.consume(this.QUEUE_NAME, async (msg) => {
        if (!msg) return;

        try {
          const payload = JSON.parse(msg.content.toString());
          this.logger.log(`📦 Received payload for Tracking ID: ${payload.queueId}`);

          // Call the service to save order in Database
          await this.orderService.saveOrderToDatabase(payload);

          this.channel.ack(msg); // Successfully processed
        } catch (error) {
          this.logger.error(`🔴 Error processing message: ${error.message}`);
          this.channel.nack(msg, false, true); // Requeue for retry
        }
      });
    } catch (error) {
      this.logger.error(`🔴 Orders Consumer connection failed: ${error.message}`);
      setTimeout(() => this.initConsumer(), 5000); // Retry in 5 seconds
    }
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}