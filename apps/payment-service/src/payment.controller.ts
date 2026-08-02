import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CurrentUser, JwtAuthGuard, type JwtPayload } from 'libs/jwt-shared/src';
import { InitialPaymentDto } from './dto/initial-payment.dto';
import { type Request } from 'express';
import { InitialPaymentCreationDto } from './dto/initial-payment-creation.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';


@ApiTags('Payments')
@Controller('') 
export class PaymentServiceController {
  constructor(private readonly paymentService: PaymentService,
  ) {}

  // @Get('health')
  // @ApiOperation({ summary: 'Payment service health check' })
  // @ApiOkResponse({ description: 'Service is running', type: String })
  // getHello(): string {
  //   // return this.paymentService.getHello();
  // }

  @UseGuards(JwtAuthGuard)
  @Post('initiate')
  @ApiBearerAuth('access-token')
  async initiate(
    @Body() dto: InitialPaymentDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request
) {
 const accessToken = req.cookies.accessToken;
  return this.paymentService.initiate(dto, {
    userId: user?.sub,
    accessToken: accessToken
  })
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  @ApiBearerAuth('access-token')
  async verify(
    @Body() dto: VerifyPaymentDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request
) {
 const accessToken = req.cookies.accessToken;
  return this.paymentService.verify(dto, {
    userId: user?.sub,
    accessToken: accessToken
  })
  }
  
  @ApiBearerAuth('access-token')
  @Post("create")
  async createpaymentdummyEntry(@Body() dto: InitialPaymentCreationDto) {
    return this.paymentService.createdummyEntry(dto) ;
  }


}