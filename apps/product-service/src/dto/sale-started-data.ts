import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFlashSaleDto {
  @ApiProperty({ example: 'iphone_15_pro', description: 'Unique ID of the product' })
  @IsString()
  @IsNotEmpty({ message: 'productId hona zaroori hai!' })
  productId: string;

  @ApiProperty({ example: 1000, description: 'Total stock available for flash sale' })
  @IsNumber()
  @Min(1, { message: 'Stock kam se kam 1 hona chahiye!' })
  initialStock: number;

  @ApiProperty({ example: 49999, description: 'Base price of the product' })
  @IsNumber()
  @Min(0, { message: 'Price negative nahi ho sakti!' })
  basePrice: number;
}