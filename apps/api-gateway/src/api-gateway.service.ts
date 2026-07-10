import { Injectable } from '@nestjs/common';
import { RedisService } from './common/redis/redis.service';
import { RabbitMQService } from './common/rabbitmq/rabbitmq.service';
import { CHECK_AND_DECR_STOCK_LUA } from './common/redis/redis-scripts.constants.ts';
import { RabbitMQConfig } from './common/rabbitmq/rabbitmq.constrants';

export interface BookTicketReturnData {
  success: Boolean,
  status: string;
  message :string;
  trackingId?: string | null,
  lockedPrice?: number | null,
}

@Injectable()
export class ApiGatewayService {
  constructor(
    private readonly redisService:RedisService,
    private readonly rabbitMQService: RabbitMQService
  ){}
  getHello(): string {
    return 'Hello I am gateway!';
  }

  async bookTicket(params: {
    productId: string;
    userId: string;
  }): Promise<BookTicketReturnData> {
    const redis = this.redisService.getClient();
    const productId = params.productId;
    const userId = params.userId;

    console.log("stock",await redis.get(`product:${params.productId}:stock`))

      // 📜 1. ATOMIC GATEKEEPER CHECK: Redis ke andar Lua script chalayi
    // Parameter 1: Lua script string
    // Parameter 2: Number of keys we are passing (1 key)
    // Parameter 3: The actual Redis key name (which becomes KEYS[1] inside Lua)
    const result = await redis.eval(CHECK_AND_DECR_STOCK_LUA, 1, `product:${params.productId}:stock`);

    console.log(`[Gatekeeper] Lua Script Result for ${params.productId}:`, result);

    // Case A: Agar admin ne sale start hi nahi ki (Key missing hai)
    if (result === -1) {
      return { 
        success: false, 
        status: 'NOT_FOUND', 
        message: 'Flash sale has not been initialized for this product yet!' 
      };
    }

    // Case B: Agar stock 0 ya usse kam ho chuka hai (Sold Out)
    if (result === 0) {
      return { 
        success: false, 
        status: 'SOLD_OUT', 
        message: 'All items sold out! Better luck next time.' 
      };
    }

    // 💰 Case C: Stock mil gaya! (Result > 0 hai aur Redis mein stock safely decrement ho chuka hai)
    
    // 2. Real-time dynamic price nikaalo billing ke liye
    const dynamicPrice = await redis.get(`product:${params.productId}:current_price`) || '500';
    const trackingId = `track_${Math.random().toString(36).substring(2, 9)}`;

    // 📦 Async Processing ke liye message payload taiyar kiya
    const payload = {
      productId,
      userId,
      purchasedPrice: parseFloat(dynamicPrice),
      queueId: trackingId,
      timestamp: Date.now(),
    };

    // 3. RabbitMQ Exchange mein natively publish kar diya
    await this.rabbitMQService.publishToExchange(
      RabbitMQConfig.flashSale.exchange,
      RabbitMQConfig.flashSale.routingKey,
      payload
    );

    // 🏁 User ko bina delay ke instant response bhej diya (Peeche worker DB entry karta rahega)
    return {
      success: true,
      status: 'IN_WAITING_ROOM',
      message: 'Request accepted successfully. Your order is being processed in the queue!',
      trackingId,
      lockedPrice: parseFloat(dynamicPrice),
    };
  }
}
