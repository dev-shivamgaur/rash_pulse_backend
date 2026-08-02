export const RabbitMQConfig = {

    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  
    flashSale: {
  
      exchange: 'flash_sale_exchange',
  
      exchangeType: 'fanout',
  
      queue: 'flash_sale_queue',
  
      routingKey: 'product_lock',
  
    },
  
    auth: {
  
      exchange: 'auth_exchange',
  
      exchangeType: 'direct',
  
      queue: 'auth_queue',
  
      routingKey: 'auth',
  
    },
  
  };