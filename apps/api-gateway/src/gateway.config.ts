export interface GatewayServiceRoute {
  name: string;
  gatewayPrefix: string;
  targetEnvKey: string;
  defaultTarget: string;
  docsJsonPath: string;
}

export const GATEWAY_SERVICE_ROUTES: GatewayServiceRoute[] = [
  {
    name: 'Auth Service',
    gatewayPrefix: '/api/v1/auth',
    targetEnvKey: 'AUTH_SERVICE_URL',
    defaultTarget: 'http://localhost:5001',
    docsJsonPath: '/api/v1/docs-json/auth',
  },
  {
    name: 'Order Service',
    gatewayPrefix: '/api/v1/orders',
    targetEnvKey: 'ORDER_SERVICE_URL',
    defaultTarget: 'http://localhost:5002',
    docsJsonPath: '/api/v1/docs-json/orders',
  },
  {
    name: 'Product Service',
    gatewayPrefix: '/api/v1/products',
    targetEnvKey: 'PRODUCT_SERVICE_URL',
    defaultTarget: 'http://localhost:5003',
    docsJsonPath: '/api/v1/docs-json/products',
  },
  {
    name: 'Payment Service',
    gatewayPrefix: "/api/v1/payments",
    targetEnvKey: 'PAYMENT_SERVICE_URL',
    defaultTarget: 'http://localhost:5004',
    docsJsonPath: '/api/v1/docs-json/payments'
  },
  {
    name: 'Notification Service',
    gatewayPrefix: "/api/v1/notifications",
    targetEnvKey: 'NOTIFICATION_SERVER_URL',
    defaultTarget: 'http://localhost:5005',
    docsJsonPath: '/api/v1/docs-json/notifications'
  }
];
