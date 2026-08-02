import {
    Injectable,
    Logger,
    OnModuleInit,
    OnModuleDestroy,
  } from '@nestjs/common';
  import amqp, { Channel, ChannelModel } from 'amqplib';
  import { RabbitMQConfig } from './rabbitmq.constrants';
import { randomUUID } from 'crypto';
  
  @Injectable()
  export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RabbitMQService.name);
    private connection!: ChannelModel;
    private channel!: Channel;
  
    // 1. Connection banana
    private async connect() {
      try {
        this.connection = await amqp.connect(RabbitMQConfig.url);
        this.channel = await this.connection.createChannel();
        console.log('🚀 RabbitMQ Connected inside API Gateway');
      } catch (error) {
        console.error(`🔴 RabbitMQ Connection Failed: ${error}`);
        throw error;
      }
    }
    
  
    // 2. Gateway sirf Exchange ensure karega, Queue nahi banayega!
    private async setupExchanges() {
      // Ensure Flash Sale Exchange exists
      await this.channel.assertExchange(
        RabbitMQConfig.flashSale.exchange,
        RabbitMQConfig.flashSale.exchangeType,
        { durable: true }
      );
  
      // Ensure Auth Exchange exists
      await this.channel.assertExchange(
        RabbitMQConfig.auth.exchange,
        RabbitMQConfig.auth.exchangeType,
        { durable: true }
      );
      
      console.log('📢 Infrastructure Exchanges verified (No queues created here)');
    }
  
    // 3. Dynamic Publish Function jo aapka Controller call karega
    async publishToExchange(exchange: string, routingKey: string, payload: any) {
      const correlationId = randomUUID();

      if (!this.channel) {
        throw new Error('RabbitMQ Channel is not initialized yet!');
      }

      try {

        const replyQueue = await this.channel.assertQueue('',{
          exclusive: true,
        });

        return new Promise((resolve) => {
          this.channel.consume(
            replyQueue.queue,
            (msg) => {
              if(!msg) return;
              
              if (msg.properties.correlationId === correlationId) {
                resolve(
                  JSON.parse(msg.content.toString())
              );
              }
            },
            {
              noAck: true,
            }
          );

          this.channel.publish(
            exchange,
            routingKey,
            Buffer.from(JSON.stringify(payload)),
            {
              correlationId,
              replyTo: replyQueue.queue,
              persistent: true,
          }
          );
        })
        
       
        
        // console.log(`📥 Data published to [${exchange}] via key [${routingKey}]`);
      } catch (error) {
        console.error(`🔴 Failed to publish message: ${error}`);
        throw error;
      }
    }
  
    async onModuleInit() {
      await this.connect();
      await this.setupExchanges();
    }
  
    async onModuleDestroy() {
      await this.channel?.close();
      await this.connection?.close();
      console.log('🛑 RabbitMQ Connection closed cleanly');
    }
  }