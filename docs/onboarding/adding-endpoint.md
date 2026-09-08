# Onboarding — añadir un endpoint

Paso a paso para añadir un nuevo endpoint al backend respetando todas las
convenciones del proyecto.

## ⚠️ Antes de empezar — Regla #1

**Este endpoint debe devolver el envelope `{ message, data, error? }`.**

Ningún endpoint devuelve un objeto crudo. Cualquier controller termina
en uno de estos dos patrones:

```ts
return apiOk('Mensaje en inglés', result);              // 2xx
return apiCreated('Created', result);                    // 201
throw new AppHttpException(ErrorCode.X, 'safe msg');     // 4xx/5xx
```

El envelope lo enforza el test e2e
[openapi-envelope.e2e-spec.ts](../../backend/test/openapi-envelope.e2e-spec.ts)
en CI. Si tu endpoint no lo respeta, el PR no se puede mergear.

→ Contrato completo:
[api-contracts.md](../conventions/api-contracts.md#tldr--regla-del-envelope)
→ Helpers:
[`apiOk`/`apiFail`](../../backend/src/common/types/api-response.type.ts)
→ Catálogo en vivo: `http://localhost:3333/docs`

Si la guía de abajo te pide escribir código que NO usa el envelope,
algo está mal — vuelve a leer la regla.

## Paso 1: Crear el DTO

Los DTOs viven en `src/modules/<feature>/dto/`. Si el feature no existe,
crea la carpeta del módulo primero.

```ts
// src/modules/example/dto/create-example.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateExampleDto {
  @ApiProperty({
    description: 'Short title for the example',
    example: 'My first example',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title!: string;

  @ApiProperty({
    description: 'Optional longer description',
    required: false,
    example: 'A longer description here',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
```

**Reglas:**

- Descripciones en **inglés**.
- `example` siempre que tenga sentido.
- Type-only fields con `!` (definite assignment).
- Usar `class-validator` para validación, no Zod (Zod solo en `env.validation.ts`).

Si el endpoint devuelve datos, crea también el DTO de respuesta:

```ts
// src/modules/example/dto/example.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ExampleDto {
  @ApiProperty({ description: 'Unique identifier', example: 'a1b2c3d4' })
  id!: string;

  @ApiProperty({ description: 'Title of the example', example: 'My example' })
  title!: string;
}
```

## Paso 2: Crear el service

```ts
// src/modules/example/example.service.ts
import { Injectable } from '@nestjs/common';
import { AppHttpException } from '@/common/errors/app-http.exception';
import { ErrorCode } from '@/common/errors/error-codes';
import type { CreateExampleDto } from './dto/create-example.dto';
import type { ExampleDto } from './dto/example.dto';

@Injectable()
export class ExampleService {
  async create(input: CreateExampleDto, userId: string): Promise<ExampleDto> {
    // ... lógica de BD, AI, lo que sea
    if (!something) {
      throw new AppHttpException(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Parent resource not found',
      );
    }
    return { id: 'generated', title: input.title };
  }
}
```

**Reglas:**

- **Nunca** `throw new NotFoundException(...)` directo de Nest. Usar
  `AppHttpException(ErrorCode.X, 'safe message')`.
- Tipos de retorno explícitos.
- Errores con mensaje seguro (sin SQL, paths, secrets).

## Paso 3: Crear el controller

```ts
// src/modules/example/example.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponseOf, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { apiOk } from '@/common/types/api-response.type';
import { ApiErrorDto } from '@/common/errors/api-error.dto';
import { CreateExampleDto } from './dto/create-example.dto';
import { ExampleDto } from './dto/example.dto';
import { ExampleService } from './example.service';

@ApiTags('example')
@ApiBearerAuth('access-token')
@Controller('example')
export class ExampleController {
  constructor(private readonly service: ExampleService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new example',
    description: 'Creates an example owned by the authenticated user',
  })
  @ApiCreatedResponseOf(ExampleDto)
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExampleDto,
  ): Promise<ReturnType<typeof apiOk<ExampleDto>>> {
    const result = await this.service.create(dto, user.id);
    return apiOk('Example created successfully', result);
  }
}
```

**Reglas:**

- El método **siempre** devuelve `apiOk(message, data)` o `apiCreated(...)`.
- Documenta con `@ApiOperation`, `@ApiTags`, `@ApiBearerAuth`, y los
  helpers envelope (`ApiCreatedResponseOf`, `ApiOkResponseOf`).
- Cada respuesta de error debe tener su decorador (`@ApiBadRequestResponse`,
  `@ApiUnauthorizedResponse`, etc.) con `type: ApiErrorDto`.

## Paso 4: Registrar el módulo

```ts
// src/modules/example/example.module.ts
import { Module } from '@nestjs/common';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';

@Module({
  controllers: [ExampleController],
  providers: [ExampleService],
})
export class ExampleModule {}
```

Y añadir `ExampleModule` a los `imports` de
[`backend/src/app.module.ts`](../../backend/src/app.module.ts).

## Paso 5: Tests

Mínimo: un unit test para el service y un e2e para el endpoint.

**Unit** (`example.service.spec.ts`):

```ts
describe('ExampleService', () => {
  it('creates an example for the authenticated user', async () => {
    const service = new ExampleService(/* mocks */);
    const result = await service.create({ title: 'foo' }, 'user-id');
    expect(result.title).toBe('foo');
  });
});
```

**E2E** (`test/example.e2e-spec.ts`):

```ts
describe('POST /example', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService).useValue(mockEnv)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  it('returns 201 with the envelope', () => {
    return request(app.getHttpServer())
      .post('/api/v1/example')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'foo' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toMatchObject({
          message: expect.any(String),
          data: { title: 'foo' },
        });
      });
  });
});
```

## Paso 6: Verificar

```bash
cd backend
npm run verify
```

Y luego añadir al menos un `ErrorCode` nuevo (si lo necesitas) siguiendo
[adding-error-code.md](./adding-error-code.md).