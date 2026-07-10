import { forwardRef, Module } from "@nestjs/common";
import { ProductConsumerService } from "./rabbitmq.service";
import { ProductServiceModule } from "../../product-service.module";


@Module({
    imports:[
        forwardRef(()=>ProductServiceModule)
        ],
    providers: [ProductConsumerService],
    exports: [ProductConsumerService]
})


export class ProductMQModule{}