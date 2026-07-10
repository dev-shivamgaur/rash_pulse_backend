import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order-service.service';
import { PrismaService } from './prisma/prisma.service';
import type{ Request } from 'express';

@ApiTags('Orders')
@Controller()
export class OrderServiceController {
  constructor(private readonly orderServiceService: OrderService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Order service health check' })
  @ApiOkResponse({ description: 'Service is running', type: String })
  getHello(@Req() req: Request): string {
    console.log(req.cookies)
    return this.orderServiceService.getHello();
  }


  @Get('status/:trackingId') 
  @ApiOperation({ summary: 'Check order status by tracking ID (Queue ID)' })
  @ApiOkResponse({ description: 'Returns current order processing status' })
  async getOrderStatus(@Param('trackingId') trackingId: string) {
    // Controller request ko lekar service ke paas bhejega
    return await this.orderServiceService.checkOrderStatus(trackingId);
  }
}
