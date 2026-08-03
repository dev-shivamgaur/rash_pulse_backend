import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from './common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac, randomBytes, randomUUID } from 'crypto';

// Prisma Generated Enums & Models
import { PaymentRecordStatus, Prisma } from '../generated/prisma';

// DTOs
import { InitialPaymentDto } from './dto/initial-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { InitialPaymentCreationDto } from './dto/initial-payment-creation.dto';
import { PaymentPublisherService } from './common/rabbitmq/rabbitmq.service';

export interface OrderInterface {
  id: string;
  orderId: string;
  reservationId: string;
  userId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  status: string;
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUNDED = 'REFUNDED',
  REFUND_FAILED = 'REFUND_FAILED',
}

type PaymentMeta = {
  clientSecret?: string;
  [key: string]: any;
};

export type PaymentAccessContext = {
  userId: string;
  accessToken: string;
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly gatewaySecret: string;
  private readonly ROUTING_KEY_SUCCESS: string;
  private readonly ROUTING_KEY_FAILED: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly rabbitMQ: PaymentPublisherService,
  ) {
    this.gatewaySecret =
      this.config.get<string>('GATEWAY_SECRET') || 'my_super_secret_mock_key_123';
       this.ROUTING_KEY_SUCCESS = this.config.get<string>('PAYMENT_SUCCESS_ROUTING_KEY') || 'payment.order.succeeded';
       this.ROUTING_KEY_FAILED = this.config.get<string>('PAYMENT_FAILED_ROUTING_KEY') || 'payment.order.failed';
  }

  // =========================================================================
  // 🔑 HELPER METHODS: MOCK GENERATORS & HMAC SIGNATURE
  // =========================================================================

  private generateMockIntentId(): string {
    return `order_intent_${Date.now()}_${randomBytes(4).toString('hex')}`;
  }

  private generateMockClientSecret(): string {
    return `sec_mock_${randomBytes(16).toString('hex')}`;
  }

  private generateMockProviderRef(): string {
    return `pay_ref_${randomUUID()}`;
  }

  /**
   * Signature Logic: HMAC SHA-256 (providerIntentId + "|" + razorpayPaymentId)
   */
  public generateHmacSignature(
    providerIntentId: string,
    razorpayPaymentId: string,
  ): string {
    const payload = `${providerIntentId}|${razorpayPaymentId}`;
    return createHmac('sha256', this.gatewaySecret)
      .update(payload)
      .digest('hex');
  }

  // =========================================================================
  // 🟢 1. INITIATE ROUTE (Existing Dummy Payment Record Ko Fetch & Attach Karo)
  // =========================================================================
  async initiate(dto: InitialPaymentDto, ctx: PaymentAccessContext) {
    // 1. Order Microservice se Order details fetch karo
    const order: OrderInterface = await this.getOrder(
      dto,
      ctx.userId,
      ctx.accessToken,
    );

    // 2. Access Ownership Check
    this.assertOrderAccess(order, ctx);

    // 3. Order Status Check
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is not awaiting online payment');
    }

    // 4. Order Create ke waqt jo Dummy Record bana tha, usko DB se dhundo
    let payment = await this.prisma.payment.findUnique({
      where: { orderId: dto.orderId },
    });

    if (!payment) {
      throw new NotFoundException('Payment record for this order was not initialized');
    }

    if (payment.status !== PaymentRecordStatus.PENDING) {
      throw new ConflictException(`Payment is already ${payment.status}`);
    }

    let metadata = (payment.metadata as PaymentMeta) || {};
    let providerIntentId = payment.providerIntentId;
    let clientSecret = metadata?.clientSecret;

    // 5. Agar Order time wale record mein intentId/clientSecret nahi tha, toh generate karke DB update karo
    if (!providerIntentId || !clientSecret) {
      providerIntentId = this.generateMockIntentId();
      clientSecret = this.generateMockClientSecret();
      metadata = { ...metadata, clientSecret };

      payment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerIntentId: providerIntentId,
          metadata: metadata as Prisma.InputJsonValue,
        },
      });
    }

    // 6. Return Data for Postman / Frontend JS SDK
    return {
      paymentId: payment.id,
      orderId: order.id,
      amount: Number(payment.amount),
      currency: payment.currency,
      provider: payment.provider,
      providerIntentId: payment.providerIntentId,
      clientSecret: clientSecret,
      publishableKey: 'pk_mock_publishable_123',
    };
  }

  // =========================================================================
  // 🔵 2. VERIFY ROUTE (Signature Verification & Database Update)
  // =========================================================================
  async verify(dto: VerifyPaymentDto, ctx: PaymentAccessContext) {
    // 1. Payment Record Fetch Karo
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
    });
    console.log(payment)

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    // Idempotency: Pehle se success toh duplicate update block karo
    if (payment.status === PaymentRecordStatus.SUCCEEDED) {
      return {
        success: true,
        message: 'Payment already verified previously',
        paymentId: payment.id,
        status: OrderStatus.PAID,
      };
    }

    if (!payment.providerIntentId) {
      throw new BadRequestException('Payment intent was not initialized properly');
    }

    // 2. SIGNATURE CHECK (Expected HMAC vs Received Signature)
    // const expectedSignature = this.generateHmacSignature(
    //   payment.providerIntentId,
    //   dto.razorpayPaymentId,
    // );
try {
  
      const isMockProvider = payment.provider === 'mock';
  
      if (!isMockProvider) {
        // REAL GATEWAY: Tabhi HMAC Signature Calculate aur Verify karo
        const expectedSignature = this.generateHmacSignature(
          payment.providerIntentId,
          dto.razorpayPaymentId,
        );
      
        if (expectedSignature !== dto.razorpaySignature) {
          this.logger.error(
            `Signature Mismatch! Expected: ${expectedSignature}, Received: ${dto.razorpaySignature}`,
          );
          throw new BadRequestException(
            'Invalid Payment Signature! Fake or tampered payment attempt.',
          );
        }
      } else {
        // MOCK GATEWAY: Logger mein print kar do ki check skip ho raha hai
        this.logger.log(`Mock payment detected. Skipping HMAC signature check for Payment ID: ${payment.id}`);
      }
  
      // 3. Payment Status SUCCEEDED karo aur providerPaymentRef save karo
      const providerPaymentRef = dto.razorpayPaymentId || this.generateMockProviderRef();
  
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentRecordStatus.SUCCEEDED,
          providerPaymentRef: providerPaymentRef,
        },
      });
  
  
      await this.rabbitMQ.publishPaymentEvent(this.ROUTING_KEY_SUCCESS, {
        orderId: updatedPayment.orderId,
        paymentId: updatedPayment.id,
        paymentProvidedRef: updatedPayment.providerPaymentRef,
        paymentProvidedIntend: updatedPayment.providerIntentId,
        paymentProvider: updatedPayment.provider,
        paymentStatus: updatedPayment.status,
        amount: updatedPayment.amount,
        message : 'Payment Confirmed!',
      });
  

  
      return {
        success: true,
        message: 'Payment verified and Order marked as PAID successfully',
        paymentId: updatedPayment.id,
        providerPaymentRef: updatedPayment.providerPaymentRef,
        status: OrderStatus.PAID,
      };
} catch (error) {
  if (!(error instanceof BadRequestException)) {
    await this.handlePaymentFailure(payment, error.message || 'Payment Verification Exception');
  }
  throw error;
}
  }

  // =========================================================================
  // 🟡 3. WEBHOOK ROUTE (Direct Background Gateway Listener)
  // =========================================================================
  async handleWebhook(rawBody: any, webhookSignature: string) {
    const expectedSignature = createHmac('sha256', this.gatewaySecret)
      .update(JSON.stringify(rawBody))
      .digest('hex');

    if (expectedSignature !== webhookSignature) {
      throw new UnauthorizedException('Invalid Webhook Signature');
    }

    const { event, payload } = rawBody;

    if (event === 'payment.captured') {
      const intentId = payload.payment.entity.order_id;
      const paymentRef = payload.payment.entity.id;

      const payment = await this.prisma.payment.findUnique({
        where: { providerIntentId: intentId },
      });

      if (payment && payment.status !== PaymentRecordStatus.SUCCEEDED) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentRecordStatus.SUCCEEDED,
            providerPaymentRef: paymentRef,
          },
        });

      }
    }

    return { received: true };
  }

  // =========================================================================
  // 🛠️ PRIVATE UTILITIES
  // =========================================================================


  private async handlePaymentFailure(payment: any, reason: string) {
    // DB Update
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentRecordStatus.FAILED,
      },
    });
  
    // Publish Failure Event to Order Service
    await this.rabbitMQ.publishPaymentEvent(this.ROUTING_KEY_FAILED, {
      orderId: payment.orderId,
      paymentId: payment.id,
      paymentProvidedRef: payment.providerPaymentRef,
      paymentProvidedIntend: payment.providerIntentId,
      paymentProvider: payment.provider,
      paymentStatus: PaymentRecordStatus.FAILED,
      amount: payment.amount,
      message: 'Payment is fail for some reason!'
    });
  }

  private async getOrder(
    dto: InitialPaymentDto,
    userId: string,
    accessToken: string,
  ): Promise<OrderInterface> {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/v1/orders/get-order/${dto.orderId}`,
        {
          headers: {
            Cookie: `accessToken=${accessToken}`,
          },
        },
      );

      const orderData = response?.data;
      if (!orderData) {
        throw new NotFoundException('Order not found in Order Service');
      }

      return {
        id: orderData.id,
        orderId: orderData.orderId,
        reservationId: orderData.reservationId,
        userId: orderData.userId,
        productId: orderData.productId,
        quantity: Number(orderData.quantity),
        priceAtPurchase: Number(orderData.priceAtPurchase),
        status: orderData.status,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch order: ${error}`);
      throw new BadRequestException('Could not verify order details from Order Service');
    }
  }

  async createdummyEntry(dto: InitialPaymentCreationDto) {
    try {
      const payment = await this.prisma.payment.create({
        data: {
          orderId: dto.orderId,
          amount: dto.amount,
          metadata: dto.metadata as Prisma.InputJsonValue,
        },
      });
  
      if (!payment) {
        throw new HttpException(
          'payment entry could not be created',
          HttpStatus.EXPECTATION_FAILED,
        );
      }
  
      return payment;
    } catch (error) {
      this.logger.error(`Error creating dummy payment entry: ${error}`);
      throw error;
    }
  }


  // private async updateOrderStatusInOrderService(
  //   orderId: string,
  //   status: OrderStatus,
  //   accessToken: string,
  // ) {
  //   try {
  //     await axios.patch(
  //       `http://localhost:8000/api/v1/orders/update-status/${orderId}`,
  //       { status },
  //       {
  //         headers: {
  //           Cookie: `accessToken=${accessToken}`,
  //         },
  //       },
  //     );
  //   } catch (error) {
  //     this.logger.error(`Failed to update Order Service status: ${error}`);
  //   }
  // }

  private assertOrderAccess(
    order: { userId: string },
    ctx: PaymentAccessContext,
  ): void {
    if (ctx.userId && order.userId !== ctx.userId) {
      throw new ForbiddenException('Not allowed to access this order');
    }
  }
}