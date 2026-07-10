import { forwardRef, Module } from "@nestjs/common";
import { OrderConsumerService } from "./rabbitmq.service";
import { OrderServiceModule } from "apps/order-service/src/order-service.module";



@Module({
    imports:[forwardRef(()=>OrderServiceModule)],
    providers:[OrderConsumerService],
    exports: [OrderConsumerService]
})

export class RabbitMQModule{}