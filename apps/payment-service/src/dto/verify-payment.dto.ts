import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({default: 'uuid'})
  @IsNotEmpty({ message: 'Payment ID is required' })
  @IsString({ message: 'Payment ID must be a string' })
  @IsUUID('4', { message: 'Payment ID must be a valid UUID' })
  paymentId: string;

  @IsNotEmpty({ message: 'Razorpay Payment ID is required' })
  @IsString({ message: 'Razorpay Payment ID must be a string' })
  razorpayPaymentId: string;

  @IsNotEmpty({ message: 'Razorpay Signature is required' })
  @IsString({ message: 'Razorpay Signature must be a string' })
  razorpaySignature: string;
}