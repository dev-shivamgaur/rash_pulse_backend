import { BadRequestException, HttpCode, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { OrderStatus } from '../generated/prisma';
import { orderQueueData } from './common/rabbitmq/rabbitmq.service';
import { RedisService } from './common/redis/redis.service';
import { JwtAuthGuard, JwtPayload } from 'libs/jwt-shared/src';
import axios from 'axios'

export interface OrderStatusInterface {
  status: string;
  message: string;
  orderId?: string | null;
}

export interface PaymentEventDataInterface {
  orderId: string;
  paymentId: string;
  paymentProvidedRef: string | null;
  paymentProvidedIntend: string | null;
  paymentProvider: string | null;
  paymentStatus: string;
  amount: string;
  message: string;
}

@Injectable()
export class OrderService {

  constructor( 
    private readonly prisma :PrismaService,
    private readonly redis: RedisService,
  ) {}

  getHello(): string {
    return 'Hello I am orders!';
  }


async saveOrderToDatabase(payload: orderQueueData) {
  const { productId, userId, purchasedPrice, queueId, timestamp, reservationToken } = payload;

  console.log(payload.expiresAt);

  let expiresAt: Date;
  
  if (payload.expiresAt && !isNaN(Number(payload.expiresAt))) {
    const secondsToExpire = Number(payload.expiresAt); 
  
    expiresAt = new Date(Date.now() + (secondsToExpire * 1000)); 
  } else {
   
    expiresAt = new Date(Date.now() + (300 * 1000));
  }

  let leftTime: number;
  const orderId = `Ord_${Math.random().toString(36).substring(2, 16).toUpperCase()}`;

  try {
    console.log(`💾 Saving order to database for Tracking ID: ${queueId}...`);

    const order = await this.prisma.order.create({ 
      data: { 
        userId, 
        productId, 
        priceAtPurchase: purchasedPrice, 
        status: OrderStatus.PENDING_PAYMENT,
        reservationId: reservationToken,
        orderId: orderId,
        expiresAt: expiresAt, 
        queueId: payload.queueId
      } 
    });

    leftTime = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      
    const mockSavedOrder = {
      id: order.id,
      userId,
      productId,
      purchasedPrice,
      queueId,
      status: OrderStatus.PENDING_PAYMENT,
      createdAt: new Date(timestamp ? timestamp : Date.now()),
      reservationId: reservationToken,
      expiresAt: leftTime, 
    };

    const metadata = {
      clientSecret: "",
      customerMobNum: "",
      ipAddress: "",
      paymentAttemptCount: 1,
      orderItemsSummary: "",
    }

    const payment = this.initializedPayment(order.id, purchasedPrice,  metadata );
    console.log(payment);

    console.log(`✅ Order successfully written to Database! Order ID: ${mockSavedOrder.id}`);
    return mockSavedOrder;
  } catch (error) {
    console.error(`🔴 Database Write Failed: ${error}`);
    throw error;
  }
}

  async checkOrderStatus(orderId: string): Promise<OrderStatusInterface> {
    console.log(`🔍 Checking DB status for Tracking ID: ${orderId}`);

    // 1. Yahan aap apna actual DB query chalaoge
    // Example: 
    const orderExistsInDb = await this.prisma.order.findUnique({ 
      where: { orderId: orderId } });
    
    
    if (!orderExistsInDb) {
      return {
        status: OrderStatus.PENDING_PAYMENT,
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

  


  async getOrderDetails(user:JwtPayload, orderId: string){

    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
      }
    });

    return order;
  }

  async savePaymentSuccess(payload: PaymentEventDataInterface) {
    try {
      if (!payload || !payload.orderId) {
        console.error('❌ Invalid payload received in savePaymentSuccess');
        return; 
      }

      const existingOrder = await this.prisma.order.findUnique({
        where: { id: payload.orderId },
      });

      if (!existingOrder) {
        console.error(` Order not found for ID: ${payload.orderId}`);
        return;
      }


      if (existingOrder.status === OrderStatus.PAID) {
        console.log(` Order ${payload.orderId} is already marked as PAID. Skipping.`);
        return;
      }

      const updatedOrder = await this.prisma.order.update({
        where: { id: payload.orderId },
        data: {
          status: OrderStatus.PAID,
          // Optional: Agar Payment details order table par store kar rahe hain
          paymentId: payload.paymentId,
          // providerPaymentRef: payload.providerPaymentRef,
        },
      });

      console.log(`✅ Order ${updatedOrder.id} successfully updated to PAID`);

    } catch (error) {
      console.error(`❌ Error updating order status for ID: ${payload?.orderId}`, error);
      // Consumer level ko error throw karein taaki RabbitMQ handle/requeue kar sake
      throw error; 
    }
  }

  async savePaymentFailed(payload: PaymentEventDataInterface): Promise<void> {
    const { orderId, message } = payload || {};

    // 1. Basic Payload Guard
    if (!orderId) {
      console.error('❌ Missing orderId in savePaymentFailed payload');
      return; 
    }

    try {
      // 2. Fetch Existing Order
      const existingOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true },
      });

      if (!existingOrder) {
        console.error(`⚠️ Order not found for ID: ${orderId}`);
        // Business Error: Invalid message payload data, do not requeue blindly
        return; 
      }

      // 3. Race Condition Guard: Never overwrite a PAID order
      if (existingOrder.status === OrderStatus.PAID) {
        console.warn(
          ` Ignored FAILED event for Order ${orderId}. Current status is already PAID.`,
        );
        return;
      }

      // 4. Idempotency Guard: Avoid duplicate update cycles
      if (
        existingOrder.status === OrderStatus.CANCELLED 
      ) {
        console.log(
          `ℹ Order ${orderId} is already marked as ${existingOrder.status}. Skipping.`,
        );
        return;
      }

      // 5. Atomic Update Execution
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          // DB Audit Fields (Agar Schema mein available hain):
          // cancelReason: failureReason || 'Payment failed at gateway',
          // updatedAt: new Date(),
        },
      });

      console.warn(
        `🚨 Order ${updatedOrder.id} status updated to PAYMENT_FAILED. Reason: ${
          message || 'Not Provided'
        }`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to update order payment status to FAILED for Order ID: ${orderId}`,
        error instanceof Error ? error.stack : error,
      );
      
      // Re-throw so RabbitMQ channel can NACK/Re-queue based on consumer retry policy
      throw error;
    }
  }

  private async initializedPayment(orderId, amount,  metadata) {
    try {
      const res = await axios.post(` http://localhost:8000/api/v1/payments/create`,{
        orderId, amount, metadata
      })
      console.log(res);
    } catch (error) {
      console.log(error);
      throw new HttpException("FInd the error for initialized payment", HttpStatus.FAILED_DEPENDENCY);
    }
  }
}