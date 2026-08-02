import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import amqp, { Channel, ChannelModel } from 'amqplib';
import { OrderService } from 'apps/order-service/src/order-service.service';

export interface orderQueueData {
  productId: string;
  userId: string;
  purchasedPrice: number;
  queueId: string;
  timestamp: Date;
  reservationToken: string;
  expiresAt: number;
}

@Injectable()
export class OrderConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderConsumerService.name);
  private connection!: ChannelModel;
  private channel!: Channel;

  private readonly RABBITMQ_URL = 'amqp://localhost:5672';
  private readonly QUEUE_NAME = 'orders_processing_queue';
  private readonly ROUTING_KEY = 'product_lock';
  private readonly ORDER_SERVICE_EXCHANGE_NAME = 'order_exchange';
  private readonly ORDER_ROUTINGKEY = 'reservation_created';

  // Payment-related constants
  private readonly PAYMENT_EXCHANGE_NAME = 'payment_events_exchange';
  private readonly ORDER_QUEUE_NAME = 'order_payment_queue';

  // Routing Keys
  private readonly PAYMENT_STATUS_KEY_SUCCESS = 'payment.order.succeeded';
  private readonly PAYMENT_STATUS_KEY_FAILED = 'payment.order.failed';

  constructor(private readonly orderService: OrderService) {}

  async onModuleInit() {
    await this.initConsumer();
  }

  private async initConsumer() {
    try {
      this.connection = await amqp.connect(this.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      // 1. Order Processing Infrastructure Setup
      await this.channel.assertExchange(this.ORDER_SERVICE_EXCHANGE_NAME, 'direct', { durable: true });
      await this.channel.assertQueue(this.QUEUE_NAME, { durable: true });
      await this.channel.bindQueue(this.QUEUE_NAME, this.ORDER_SERVICE_EXCHANGE_NAME, this.ORDER_ROUTINGKEY);

      // 2. Payment Events Infrastructure Setup
      await this.channel.assertExchange(this.PAYMENT_EXCHANGE_NAME, 'topic', { durable: true });
      await this.channel.assertQueue(this.ORDER_QUEUE_NAME, { durable: true });
      await this.channel.bindQueue(this.ORDER_QUEUE_NAME, this.PAYMENT_EXCHANGE_NAME, this.PAYMENT_STATUS_KEY_SUCCESS);
      await this.channel.bindQueue(this.ORDER_QUEUE_NAME, this.PAYMENT_EXCHANGE_NAME, this.PAYMENT_STATUS_KEY_FAILED);

      this.logger.log(`📥 Orders Consumer connected and ready.`);

      // 3. Listen to Order Processing Queue
      await this.consumeOrderProcessingQueue();

      // 4. Listen to Payment Queue (FIX: Calling Payment Consumer method)
      await this.consumeAndServemessage();

    } catch (error) {
      this.logger.error(`🔴 Orders Consumer connection failed: ${error}`);
      setTimeout(() => this.initConsumer(), 5000); // Retry in 5 seconds
    }
  }

  // Consumer Method 1: Order Processing
  private async consumeOrderProcessingQueue() {
    await this.channel.consume(this.QUEUE_NAME, async (msg) => {
      if (!msg) return;

      try {
        const payload: orderQueueData = JSON.parse(msg.content.toString());
        this.logger.log(`📦 Received payload for Tracking ID: ${payload.queueId}`);

        await this.orderService.saveOrderToDatabase(payload);
        this.channel.ack(msg);
      } catch (error) {
        this.logger.error(`🔴 Error processing message: ${error}`);
        this.channel.nack(msg, false, true); // Requeue for retry
      }
    });
  }

  // Consumer Method 2: Payment Status Events (FIXED Syntax Here)
  private async consumeAndServemessage() {
    await this.channel.consume(this.ORDER_QUEUE_NAME, async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        this.logger.log(`📥 Received message with Key: ${routingKey}`);

        if (routingKey === this.PAYMENT_STATUS_KEY_SUCCESS) {
          await this.orderService.savePaymentSuccess(payload);
        } else if (routingKey === this.PAYMENT_STATUS_KEY_FAILED) {
          await this.orderService.savePaymentFailed(payload);
        }

        this.channel.ack(msg);
      } catch (error) {
        this.logger.error(`Failed to process order update: ${error}`);
        // Unrecoverable errors ke liye requeue false rakhein
        this.channel.nack(msg, false, false);
      }
    }); // <-- FIXED: Closing parenthesis adding here
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}