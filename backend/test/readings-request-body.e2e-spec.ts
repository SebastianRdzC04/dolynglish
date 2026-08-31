/**
 * E2E coverage guard for the GenerateReadingDto request body. Asserts the
 * schema is documented in OpenAPI with the three fields the LLM uses to
 * bias generation: `category`, `difficulty`, `cefrLevel`.
 *
 * Historical bug (2026-08-30): the migration to Nest dropped the body
 * parameters that the old AdonisJS API accepted, leaving only an inert
 * `seed` field. Clients had no way to ask for "a hard programming text
 * about TypeScript" — the backend picked a random combination instead.
 * This test pins the contract: every field the prompt generator reads
 * from the request body must appear in the spec with the correct
 * semantic and example.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/env.config';

const mockEnv: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '0',
  HOST: '127.0.0.1',
  API_PREFIX: 'api/v1',
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  DB_USER: 'test',
  DB_PASSWORD: 'test',
  DB_DATABASE: 'test',
  JWT_SECRET: 'a'.repeat(64),
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '30d',
  AI_DEFAULT_PROVIDER: 'minimax',
  MINIMAX_API_KEY: 'sk-test',
  MINIMAX_MODEL: 'MiniMax-M3',
  MINIMAX_ENDPOINT: 'https://api.test/v1/chat',
  MINIMAX_TIMEOUT_MS: '30000',
  MINIMAX_MAX_TOKENS: '4096',
  MINIMAX_TEMPERATURE: '0.6',
};

describe('POST /readings request body is fully documented', () => {
  let app: INestApplication;
  let document: {
    paths?: Record<
      string,
      Record<string, { requestBody?: { content?: { 'application/json'?: { schema?: { $ref?: string } } } } }>
    >;
    components?: { schemas?: Record<string, { properties?: Record<string, { type?: string; enum?: string[]; example?: unknown }> }> };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider('ConfigService')
      .useValue({ get: (k: string): string => mockEnv[k] ?? '' })
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useLogger({
      log: () => undefined,
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined,
      verbose: () => undefined,
      fatal: () => undefined,
    } as never);

    const env = app.get(AppConfigService);
    app.setGlobalPrefix(env.apiPrefix);

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Dolynglish API')
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .build();
    document = SwaggerModule.createDocument(app, swaggerConfig) as unknown as typeof document;

    app.getHttpAdapter().get(`/${env.apiPrefix}/openapi.json`, (_req, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json(document);
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /readings references GenerateReadingDto', () => {
    const post = document.paths?.['/api/v1/readings']?.post;
    const ref = post?.requestBody?.content?.['application/json']?.schema?.$ref;
    expect(ref).toBe('#/components/schemas/GenerateReadingDto');
  });

  it('GenerateReadingDto documents category with the right enum and example', () => {
    const schema = document.components?.schemas?.['GenerateReadingDto'];
    expect(schema).toBeDefined();
    const category = schema?.properties?.['category'];
    expect(category).toBeDefined();
    expect(category?.type).toBe('string');
    expect(category?.enum).toEqual(
      expect.arrayContaining(['technology', 'history', 'education', 'programming', 'culture', 'pop_culture']),
    );
    expect(category?.example).toBe('technology');
  });

  it('GenerateReadingDto documents difficulty with the right enum and example', () => {
    const difficulty = document.components?.schemas?.['GenerateReadingDto']?.properties?.['difficulty'];
    expect(difficulty).toBeDefined();
    expect(difficulty?.type).toBe('string');
    expect(difficulty?.enum).toEqual(expect.arrayContaining(['easy', 'medium', 'hard']));
    expect(difficulty?.example).toBe('medium');
  });

  it('GenerateReadingDto documents cefrLevel with the right enum and example', () => {
    const cefrLevel = document.components?.schemas?.['GenerateReadingDto']?.properties?.['cefrLevel'];
    expect(cefrLevel).toBeDefined();
    expect(cefrLevel?.type).toBe('string');
    expect(cefrLevel?.enum).toEqual(expect.arrayContaining(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']));
    expect(cefrLevel?.example).toBe('B2');
  });

  it('does NOT expose a `seed` field (it was a no-op in the previous version)', () => {
    const schema = document.components?.schemas?.['GenerateReadingDto'];
    expect(schema?.properties?.['seed']).toBeUndefined();
  });
});