import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfigService } from './config/env.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Security & perf. Helmet is configured to allow the Scalar API Reference CDN
  // (cdn.jsdelivr.net) so the /docs page can load its standalone JS bundle.
  // The /docs route itself is registered BEFORE setGlobalPrefix below so it stays
  // at the root path (not under /api/v1).
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', "'unsafe-inline'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());

  // Global validation pipe — class-validator + class-transformer
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Enable CORS for the mobile client
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Scalar API reference at /docs (replaces Swagger UI).
  // IMPORTANT: register this BEFORE setGlobalPrefix so /docs stays at the root
  // and not under /api/v1.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Dolynglish API')
    .setDescription('Backend for the Dolynglish mobile app — language learning with AI-generated reading exercises')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('auth', 'User registration, login, logout, refresh')
    .addTag('user', 'User profile and streak')
    .addTag('readings', 'AI-generated English readings and evaluations')
    .addTag('ia', 'Raw chat with the active AI provider')
    .addTag('health', 'Liveness and readiness probes')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  app.use(
    '/docs',
    apiReference({
      content: document,
      theme: 'purple',
      title: 'Dolynglish API',
    }),
  );

  // API prefix (configurable via API_PREFIX, default "api/v1")
  const env = app.get(AppConfigService);
  app.setGlobalPrefix(env.apiPrefix);

  // Root health-check
  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      message: 'Dolynglish API is running',
      data: { version: '1.0.0', status: 'healthy' },
    });
  });

  await app.listen(env.port, env.host);
  const url = await app.getUrl();
  app.get(Logger).log(`Application listening on ${url}`);
  app.get(Logger).log(`API documentation: ${url}/docs`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
