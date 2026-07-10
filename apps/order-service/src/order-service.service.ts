import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { OrderStatus } from '../generated/prisma';

export interface OrderStatusInterface {
  status: string;
  message: string;
  orderId?: string | null;
}

@Injectable()
export class OrderService {

  constructor(private readonly prisma :PrismaService) {}

  getHello(): string {
    return 'Hello I am orders!';
  }

  //  Database Saving Logic Zone
  async saveOrderToDatabase(payload: any) {
    const { productId, userId, purchasedPrice, queueId, timestamp } = payload;

    try {
      console.log(`💾 Saving order to database for Tracking ID: ${queueId}...`);

       const order = await this.prisma.order.create({ data: { userId, productId, purchasedPrice, queueId, status: 'CONFIRMED' } })

      const mockSavedOrder = {
        id: order.id,
        userId,
        productId,
        purchasedPrice,
        queueId,
        status: OrderStatus.CONFIRMED,
        createdAt: new Date(timestamp),
      };

      console.log(`✅ Order successfully written to Database! Order ID: ${mockSavedOrder.id}`);
      return mockSavedOrder;
    } catch (error) {
      console.error(`🔴 Database Write Failed: ${error.message}`);
      throw error;
    }
  }

  async checkOrderStatus(trackingId: string): Promise<OrderStatusInterface> {
    console.log(`🔍 Checking DB status for Tracking ID: ${trackingId}`);

    // 1. Yahan aap apna actual DB query chalaoge
    // Example: 
    const orderExistsInDb = await this.prisma.order.findUnique({ where: { queueId: trackingId } });
    
    
    if (!orderExistsInDb) {
      return {
        status: OrderStatus.PENDING,
        message: 'Order is in the queue, please wait...',
      };
    }

    // Agar DB mein entry mil gayi, toh success state return karo
    return {
      status: 'CONFIRMED',
      message: 'Order placed successfully!',
      orderId: orderExistsInDb.id,
    };
  }
}