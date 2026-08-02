import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsIP,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class PaymentMetadataDto {
  @ApiPropertyOptional({
    example: 'sec_mock_9a8b7c6d5e4f',
    description: 'Payment client secret generated for frontend modal',
  })
  @IsOptional()
  @IsString({ message: 'clientSecret must be a string' })
  clientSecret?: string;

  @ApiPropertyOptional({
    example: 'usr_123456789',
    description: 'Unique identifier of the user making payment',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    example: 'shivam@example.com',
    description: 'Customer email address for receipts',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid customer email address' })
  customerMobNum?: string;

  @ApiPropertyOptional({
    example: '192.168.1.1',
    description: 'IP Address of the client making payment',
  })
  @IsOptional()
  @IsIP(4, { message: 'Invalid IPv4 address' })
  ipAddress?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Number of payment attempts made for this order',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentAttemptCount?: number;

  @ApiPropertyOptional({
    example: '2x Wireless Earbuds',
    description: 'Summary description of order items',
  })
  @IsOptional()
  @IsString()
  orderItemsSummary?: string;
}