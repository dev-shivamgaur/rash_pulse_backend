import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import amqp, { Channel, ChannelModel } from 'amqplib';

@Injectable()
export class PaymentPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentPublisherService.name);
  private connection!: ChannelModel;
  private channel!: Channel;

  private readonly RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  private readonly PAYMENT_EXCHANGE_NAME = 'payment_events_exchange';
  private readonly EXCHANGE_TYPE = 'topic';

  async onModuleInit() {
    await this.initPublisher();
  }

  private async initPublisher() {
    try {
      this.connection = await amqp.connect(this.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      // Step 1: SIRF Exchange Declare/Assert karein
      await this.channel.assertExchange(
        this.PAYMENT_EXCHANGE_NAME,
        this.EXCHANGE_TYPE,
        { durable: true }
      );


      this.logger.log(`🚀 Payment Publisher Ready on Exchange: ${this.PAYMENT_EXCHANGE_NAME}`);
    } catch (error) {
      this.logger.error(`🔴 Payment Publisher Connection Failed: ${error}`);
      setTimeout(() => this.initPublisher(), 5000);
    }
  }

  // Event Publish karne ka method
  async publishPaymentEvent(routingKey: string, payload: any) {
    try {
      const isSent = this.channel.publish(
        this.PAYMENT_EXCHANGE_NAME,
        routingKey, // e.g., 'payment.order.succeeded' ya 'payment.order.failed'
        Buffer.from(JSON.stringify(payload)),
        {
          persistent: true, // Server crash hone par bhi message save rahega
          contentType: 'application/json',
        }
      );

      if (isSent) {
        this.logger.log(`📤 Event published [${routingKey}]: Order ID ${payload.orderId}`);
      } else {
        this.logger.warn(`⚠️ Event write buffer full for key: ${routingKey}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to publish payment event: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}