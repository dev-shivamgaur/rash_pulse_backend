import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMetadataDto } from './payment-metadata.dto';


export class InitialPaymentCreationDto {
  @ApiProperty({
    format: 'uuid',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Unique UUID of the order',
  })
  @IsUUID('4', { message: 'orderId must be a valid UUID v4' })
  orderId: string;
  

  @ApiProperty({
    example: 500,
    description: 'Total payable amount for the order (in INR)',
  })
  @Type(() => Number) // 1. Converts String "500" to Number 500
  @IsNumber({}, { message: 'amount must be a valid number' }) // 2. Validates type is number
  @Min(1, { message: 'amount must be greater than zero' })
  amount: number;

  @ApiPropertyOptional({
    type: () => PaymentMetadataDto,
    description: 'Additional contextual dynamic metadata for the payment',
  })
  @IsOptional()
  @IsObject({ message: 'metadata must be a valid JSON object' })
  @ValidateNested() // 3. Triggers deep validation inside PaymentMetadataDto
  @Type(() => PaymentMetadataDto)
  metadata: PaymentMetadataDto;
}