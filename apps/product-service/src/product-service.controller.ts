import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductService } from './product-service.service';
import { CreateFlashSaleDto } from './dto/sale-started-data';
import { RedisService } from './common/redis/redis.service';
import { JwtAuthGuard, Role, Roles, RolesGuard } from 'libs/jwt-shared/src';

@ApiTags('Products')
@Controller('products') 
export class ProductServiceController {
  constructor(private readonly productService: ProductService,
    private redisService: RedisService
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Product service health check' })
  @ApiOkResponse({ description: 'Service is running', type: String })
  getHello(): string {
    return this.productService.getHello();
  }

  @Roles(Role.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Post('start')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) // Yeh pipe data validate karegi
  @ApiOperation({ summary: 'Admin: Initialize quantity, price, and start the Flash Sale' })
  @ApiBody({ type: CreateFlashSaleDto }) // Swagger integration
  @ApiOkResponse({ description: 'Flash sale initialized successfully in Redis' })
  async startFlashSale(@Body() createFlashSaleDto: CreateFlashSaleDto) {
    return this.productService.startFlashSale(createFlashSaleDto)
   
  }

   // 👇 Frontend API: Jisse screen par current updated price dikhega

   @Roles(Role.admin)
   @UseGuards(JwtAuthGuard, RolesGuard)
   @ApiBearerAuth('access-token')
   @Get('sale-info/:prid')
   @ApiOperation({ summary: 'Get live product details and pricing from Redis' })
   @ApiOkResponse({ description: 'Returns live product pricing data' })
   async getProductDetails(@Param('prid') productId: string) {
     return await this.productService.getLiveProductState(productId);
   }
}