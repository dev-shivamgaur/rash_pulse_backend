import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BookTicketDto {
  @ApiProperty({ example: 'iphone_sale_123', description: 'The unique ID of the product' })
  @IsString()
  @IsNotEmpty({ message: 'productId is neccessary of the every product for booking confirmation' })
  productId: string; 

}