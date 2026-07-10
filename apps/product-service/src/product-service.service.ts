import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './common/redis/redis.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly redisService: RedisService) {}

  getHello(): string {
    return 'Hello I am product!';
  }

  // 📈 AAPKA CORRECTED MATHEMATICAL PRICING ENGINE LOGIC (Called by Consumer)
  async handleDynamicPricingUpdate(payload: { productId: string }) {
    const redis = this.redisService.getClient();
    const { productId } = payload;

    try {
      this.logger.log(`🔄 Running Pricing Engine for Product ID: ${productId}`);

      // 1. Redis se values fetch karna (Fallbacks ke sath)
      const currentStockStr = await redis.get(`product:${productId}:stock`);
      const initialStockStr = await redis.get(`product:${productId}:initial_stock`);
      const basePriceStr = await redis.get(`product:${productId}:base_price`);

      const currentStock = parseInt(currentStockStr || '0', 10);
      const initialStock = parseInt(initialStockStr || '1000', 10);
      const basePrice = parseFloat(basePriceStr || '500');

      // 2. Sales Percentage Calculate karna: ((Initial - Current) / Initial) * 100
      const salesPercentage = ((initialStock - currentStock) / initialStock) * 100;
      let finalSurgePrice = basePrice;

      // 3. Dynamic Threshold Check Rules
      if (salesPercentage > 85) {
        finalSurgePrice = basePrice * 1.50; // 50% price increase
      } else if (salesPercentage > 60) {
        finalSurgePrice = basePrice * 1.30; // 30% price increase
      } else if (salesPercentage > 30) {
        finalSurgePrice = basePrice * 1.15; // 15% price increase
      }

      // 4. Redis mein updated current price set karna taaki Gateway/Frontend ise read kar sake
      await redis.set(`product:${productId}:current_price`, finalSurgePrice.toString());
      
      this.logger.log(`📈 Price Engine updated product ${productId} to ₹${finalSurgePrice} (Sales: ${salesPercentage.toFixed(2)}%)`);
      
      return { productId, salesPercentage, finalSurgePrice };
    } catch (error) {
      this.logger.error(`🔴 Dynamic Pricing Engine Error: ${error.message}`);
      throw error;
    }
  }

  async startFlashSale(params: {
    productId: string,
    initialStock: number,
    basePrice: number
  }){

    const redis = this.redisService.getClient();
    
    try {
      console.log(`🚀 Initializing Flash Sale for Product: ${params.productId}`);

      // 1. Redis mein Live Stock initialized kiya (Isi par DECR chalega)
      await redis.set(`product:${params.productId}:initial_stock`, params.initialStock.toString());
      await redis.set(`product:${params.productId}:stock`, params.initialStock.toString()); 

      // 2. Pricing Engine ke liye prices set ki
      await redis.set(`product:${params.productId}:base_price`, params.basePrice.toString());
      const currentprice = await redis.get(`product:${params.productId}:current_price`);
      console.log("currentprice",currentprice);
      await redis.set(`product:${params.productId}:current_price`, params.basePrice.toString());


      // 3. Status ko LIVE mark kiya taaki Gateway requests accept karna shuru kare
      await redis.set(`product:${params.productId}:status`, 'LIVE');

      console.log(`🔥 Sale is now LIVE for ${params.productId}. Stock: ${params.initialStock}, Price: ₹${params.basePrice}`);

      return {
        success: true,
        message: 'Flash sale has been successfully initialized and is now live!',
        data: {
          productId: params.productId,
          stockSet: params.initialStock,
          priceSet: params.basePrice,
          status: 'LIVE'
        }
      };
    } catch (error) {
      console.error(`🔴 Failed to start flash sale: ${error.message}`);
      return { success: false, message: 'Internal Server Error while starting sale' };
    }
  }

  // 🔍 Frontend/Gateway ke dekhne ke liye API Method
  async getLiveProductState(productId: string) {
    const redis = this.redisService.getClient();
    
    const [title, currentPrice, stock] = await Promise.all([
      redis.get(`product:${productId}:title`) || 'Flash Sale Item',
      redis.get(`product:${productId}:current_price`),
      redis.get(`product:${productId}:stock`),
    ]);

    return {
      productId,
      title,
      currentLivePrice: parseFloat(currentPrice || '500'),
      remainingStock: parseInt(stock || '0', 10),
    };
  }
}