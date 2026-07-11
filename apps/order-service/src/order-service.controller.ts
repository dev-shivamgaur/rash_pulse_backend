import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order-service.service';
import type{ Request } from 'express';

import {JwtPayload, JwtAuthGuard, RolesGuard, Roles, Role } from "libs/jwt-shared/src/index"


@ApiTags('Orders')
@Controller()
export class OrderServiceController {
  constructor(private readonly orderServiceService: OrderService,
  ) {}

  
  @Get()
  @ApiOperation({ summary: 'Order service health check' })
  @ApiOkResponse({ description: 'Service is running', type: String })
  getHello(@Req() req: Request): string {
    return this.orderServiceService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('status/:trackingId') 
  @ApiOperation({ summary: 'Check order status by tracking ID (Queue ID)' })
  @ApiOkResponse({ description: 'Returns current order processing status' })
  async getOrderStatus(@Param('trackingId') trackingId: string) {
    // Controller request ko lekar service ke paas bhejega
    return await this.orderServiceService.checkOrderStatus(trackingId);
  }
}
