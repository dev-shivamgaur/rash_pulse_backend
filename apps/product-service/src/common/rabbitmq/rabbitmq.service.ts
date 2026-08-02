import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import amqp, { Channel, ChannelModel } from 'amqplib';
import { ProductService } from '../../product-service.service';


@Injectable()
export class ProductConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProductConsumerService.name);
  private connection!: ChannelModel;
  private channel!: Channel;

  private readonly RABBITMQ_URL = 'amqp://localhost:5672';
  private readonly EXCHANGE_NAME = 'flash_sale_exchange';
  private readonly QUEUE_NAME = 'products_pricing_queue';
  private readonly ROUTING_KEY = 'product_lock';
  private readonly ORDER_SERVICE_EXCHANGE_NAME = 'order_exchange';
  private readonly ORDER_ROUTINGKEY = 'reservation_created';

  constructor(@Inject(forwardRef(() => ProductService))
  private readonly productService: ProductService,) {}

  async onModuleInit() {
    await this.initConsumer();
  }

  private async initConsumer() {
    try {
      this.connection = await amqp.connect(this.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.EXCHANGE_NAME, 'fanout', { durable: true });

      //order-service
      await this.channel.assertExchange(this.ORDER_SERVICE_EXCHANGE_NAME, 'direct', {durable: true} )

      await this.channel.assertQueue(this.QUEUE_NAME, { durable: true });
      await this.channel.bindQueue(this.QUEUE_NAME, this.EXCHANGE_NAME, this.ROUTING_KEY);

      this.logger.log(`📥 Products Pricing Engine listening on [${this.QUEUE_NAME}]`);

      await this.channel.consume(this.QUEUE_NAME, async (msg) => {
        if (!msg) return;

        try {
          const payload = JSON.parse(msg.content.toString());
          
          // 👉 Call service logic which handles Redis operations
          const result = await this.productService.handleDynamicPricingUpdate(payload);
          this.channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(
              JSON.stringify({
                success: true,
                data: result,
              }),
            ),
            {
              correlationId:
                  msg.properties.correlationId,
          }
          )

          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`🔴 Error inside Consumer pricing thread: ${error.message || error}`);
          this.channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(
                JSON.stringify({
                    success: false,
                    message: error.message,
                })
            ),
            {
                correlationId:
                    msg.properties.correlationId,
            }
        );

        // this.channel.ack(msg);
    

    // 🌟 FIXED LOGIC HERE
    // Agar error 'BadRequestException' hai (Active Session waali), toh wapas requeue MAT karo!
    // Ise false kar do taaki ye queue se hat jaye (Drop ho jaye ya Dead Letter Exchange me chala jaye)
    const shouldRequeue = !(error instanceof BadRequestException || error.status === 400 || error.message?.includes('active checkout session'));

    if (shouldRequeue) {
      this.logger.warn(`🔄 Requeuing message due to server/network error...`);
      this.channel.nack(msg, false, true); // Server issue par wapas bhejo
    } else {
      this.logger.warn(`🗑️ Dropping/Rejecting message to prevent infinite loop (Business Validation Failed)`);
      this.channel.nack(msg, false, false); // ✅ Requeue = false (Drop it!)
    }
  }
      });
    } catch (error) {
      this.logger.error(`🔴 Products RabbitMQ connection failed: ${error}`);
      setTimeout(() => this.initConsumer(), 5000);
    }
  }

  async publishToOrderExchange(data){
 
   try {
    
    if(!this.channel){
      throw new Error('Rabbitmq Channel is not initialized yet!');
    }

    this.channel.publish(
      this.ORDER_SERVICE_EXCHANGE_NAME,
      this.ORDER_ROUTINGKEY,
      Buffer.from(JSON.stringify(data)),
      {
        persistent: true,
      }
    )
   } catch (error) {
    console.log(error);
   }

  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}