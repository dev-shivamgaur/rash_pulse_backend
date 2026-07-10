import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiGatewayService } from './api-gateway.service';
import { RedisService } from './common/redis/redis.service';
import { RabbitMQService } from './common/rabbitmq/rabbitmq.service'; // Injected your native service

import { BookTicketDto } from './dto/book-ticket.dto';
// import { GatewayAuthGuard } from './guard/gateway-auth.guard'; // Unlock when guard is ready


@ApiTags('Gateway')
@Controller('flash-sale')
export class ApiGatewayController {
  constructor(
    private readonly apiGatewayService: ApiGatewayService,
  ) {}
  @Get()
  @ApiOperation({ summary: 'API Gateway health check' })
  @ApiOkResponse({ description: 'Gateway is running', type: String })
  getHello(): string {
    return this.apiGatewayService.getHello();
  }

  
  @Post('book')
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) // Pipes enabled for validation
  @ApiOperation({ summary: 'User: Book a flash sale ticket' })
  @ApiBody({ type: BookTicketDto })
  async bookTicket(@Req() req: any, @Body() bookTicketDto: BookTicketDto) {
    const { productId } = bookTicketDto; 
    const userId = req.user?.id || 'mock_user_shivam'; 
    return this.apiGatewayService.bookTicket({productId, userId})

  }
}