// import { Module, Global } from '@nestjs/common';
// import { ClientsModule, Transport } from '@nestjs/microservices';

import { Module } from "@nestjs/common";
import { RabbitMQService } from "./rabbitmq.service";


@Module({

  providers:[RabbitMQService],
 
  exports:[RabbitMQService]
 
 })
 
 export class RabbitMQModule{}
























// @Global() // Isko global banayenge taaki pure Gateway mein bar-bar import na karna pade
// @Module({
//   imports: [
//     ClientsModule.register([
//       {
//         name: 'RABBITMQ_CLIENT', // Is name (Token) se hum controller mein inject karenge
//         transport: Transport.RMQ,
//         options: {
//           urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
//           queue: 'flash_sale_queue', // Hamari main waiting room queue
//           queueOptions: {
//             durable: true, // Server restart par bhi queue surakshit rahegi 
//           },
//         },
//       },
//       {
//         name: 'AUTH_SERVICE_CLIENT',
//         transport: Transport.RMQ,
//         options: {
//           urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
//           queue: 'auth_queue',
//           queueOptions: { durable: true },
//         },
//       },
//     ]),
//   ],
//   exports: [ClientsModule], // Exporting taaki clients use kar sakein
// })
// export class GatewayRabbitMQModule {}

