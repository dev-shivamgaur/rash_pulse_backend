import { forwardRef, Module } from "@nestjs/common";
import { PaymentPublisherService } from "./rabbitmq.service";
import { PaymentServiceModule } from "../../payment.module";


@Module({
    imports:[
        forwardRef(()=>PaymentServiceModule)
        ],
    providers: [PaymentPublisherService],
    exports: [PaymentPublisherService]
})


export class PaymentMQModule{}