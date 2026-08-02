import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { GATEWAY_SERVICE_ROUTES } from './gateway.config';

function resolveTarget(
  configService: ConfigService,
  envKey: string,
  fallback: string,
): string {
  return configService.get<string>(envKey) ?? fallback;
}

export function setupGatewayProxies(
  app: NestExpressApplication,
  configService: ConfigService,
): void {
  for (const route of GATEWAY_SERVICE_ROUTES) {
    const target = resolveTarget(
      configService,
      route.targetEnvKey,
      route.defaultTarget,
    );

    app.use(
      route.docsJsonPath,
      createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: {
          '^/': '/docs-json',
        },
      }),
    );
  }

  for (const route of GATEWAY_SERVICE_ROUTES) {
    const target = resolveTarget(
      configService,
      route.targetEnvKey,
      route.defaultTarget,
    );

    app.use(
      route.gatewayPrefix,
      createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: {
          // Rule: Gateway prefix '/api/v1/payments' ko poora DELETE (remove) kar do
          [`^${route.gatewayPrefix}`]: '',
        },
      }),
    );
  }
}
