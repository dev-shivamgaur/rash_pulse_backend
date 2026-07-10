import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export interface SwaggerServiceEntry {
  name: string;
  url: string;
}

export interface MicroserviceSwaggerDefaults {
  title: string;
  description?: string;
  serverUrl?: string;
}

export interface GatewaySwaggerDefaults {
  title: string;
  description?: string;
  serverUrl?: string;
  services?: SwaggerServiceEntry[];
}

function createDocument(
  app: INestApplication,
  title: string,
  description: string,
  version: string,
  serverUrl?: string,
) {
  const builder = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    );

  if (serverUrl) {
    builder.addServer(serverUrl);
  }

  return SwaggerModule.createDocument(app, builder.build());
}

/* -------------------------------------------------------------------------- */
/*                             MICROSERVICE                                   */
/* -------------------------------------------------------------------------- */

export function setupMicroserviceSwagger(
  app: INestApplication,
  config: ConfigService,
  defaults: MicroserviceSwaggerDefaults,
) {
  if (!(config.get<boolean>('SWAGGER_ENABLED') ?? true)) {
    return;
  }

  const title = config.get('SWAGGER_TITLE') ?? defaults.title;
  const description =
    config.get('SWAGGER_DESCRIPTION') ??
    defaults.description ??
    '';

  const version =
    config.get('SWAGGER_VERSION') ??
    '1.0.0';

  const server =
    config.get('SWAGGER_SERVER_URL') ??
    defaults.serverUrl;

  const document = createDocument(
    app,
    title,
    description,
    version,
    server,
  );

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
  });

  const port = config.get<number>('PORT') ?? 3000;

  console.log(
    `Swagger : http://localhost:${port}/docs`,
  );

  console.log(
    `Swagger JSON : http://localhost:${port}/docs-json`,
  );
}

/* -------------------------------------------------------------------------- */
/*                             API GATEWAY                                    */
/* -------------------------------------------------------------------------- */

export function setupGatewaySwagger(
  app: INestApplication,
  config: ConfigService,
  defaults: GatewaySwaggerDefaults,
) {
  if (!(config.get<boolean>('SWAGGER_ENABLED') ?? true)) {
    return;
  }

  const title =
    config.get('SWAGGER_TITLE') ??
    defaults.title;

  const description =
    config.get('SWAGGER_DESCRIPTION') ??
    defaults.description ??
    '';

  const version =
    config.get('SWAGGER_VERSION') ??
    '1.0.0';

  const server =
    config.get('SWAGGER_SERVER_URL') ??
    defaults.serverUrl;

  const document = createDocument(
    app,
    title,
    description,
    version,
    server,
  );

  const services = defaults.services ?? [];

  const urls = [
    {
      name: title,
      url: '/api/v1/docs-json',
    },
    ...services,
  ];

  // console.log("urls",urls)

  SwaggerModule.setup('v1/docs', app, document, {
    useGlobalPrefix: true,
    customCss: `
    .swagger-ui .topbar .download-url-wrapper{
        display:flex !important;
    }
  `,
    // jsonDocumentUrl: 'v1/docs-json',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      urls: urls,
      urlsPrimaryName: title,
    },
  });

  const port =
    config.get<number>('PORT') ?? 8000;

  console.log(
    `Gateway Swagger : http://localhost:${port}/api/v1/docs`,
  );
}