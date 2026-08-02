import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";


export class InitialPaymentDto {
    @ApiProperty({format: 'uuid'})
    @IsUUID('4')
    orderId: string;
}