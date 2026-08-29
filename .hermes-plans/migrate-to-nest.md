# Plan: Migración dolynglish backend AdonisJS v6 → NestJS 11 + Drizzle

**Fecha:** 2026-08-28 (revisado)
**Rama base:** `prod` (lo que está corriendo en `localhost:57001` es la verdad actual)
**Rama de trabajo:** `feature/migrate-to-nest` → merge a `dev` → promover a `prod`

## Cambios respecto al plan original (decisiones tuyas)

1. **NO se mantiene v1 legacy**. La nueva API es la única versión. Elimino del scope: `/test/*`, `/readings/options` (mobile no los usa), `/user/profile`, `/user/me` (tampoco los usa). Reducción: 17 endpoints viejos → 12 en la nueva API, todos organizados con prefijo `/api/v1/...` para evitar colisiones y dejar puerta abierta a `v2` futura.
2. **Solo el mobile consume la API** → puedo poner nombres y estructura pensando en la UX del mobile, sin preocuparme por compatibilidad con otros clientes.
3. **Refactor profundo del IA provider**: limpio desde cero con Strategy + Factory + DTOs tipados + logging estructurado con `nestjs-pino`. La lógica de `stripThinking` se reescribe con tests desde el principio.

## Decisiones de diseño (confirmadas contigo)

| Tema | Decisión |
|---|---|
| Rama base | `prod` |
| Estructura física | `backend/` se borra y se reconstruye 100% con Nest (Adonis viejo en `backend-adonis-bak/`) |
| Compatibilidad API | nueva API con paths limpios y prefijo `/api/v1/...` (mobile actualizado después si quiere) |
| ORM | **Drizzle** (sin migraciones — schema lo aplica `infrastructure/database/postgres/01-init.sql`) |
| Auth | JWT propio con refresh token |
| Provider IA | `MiniMax-M3` (Groq queda como provider registrado pero inactivo, listo para reactivar) |
| Documentación | **Scalar** (no Swagger UI) |
| Validación | `class-validator` + `class-transformer` |
| Logger | `pino` vía `@nestjs/terminus` + `nestjs-pino` |
| Puerto dev | 3333 |
| Puerto prod | 57001 |

## FASE 0 — Preparación ✅ HECHO

- [x] Backend prod abajo
- [x] Rama `feature/migrate-to-nest` creada
- [x] Backup Adonis en `backend-adonis-bak/`
- [x] Mobile leído — confirmados los 12 endpoints que consume

## FASE 1 — Bootstrap del proyecto Nest (15 min)

```
backend/
├── package.json          # nest 11, drizzle-orm, pg, class-validator, @nestjs/swagger, @scalar/nestjs-api-reference, nestjs-pino
├── tsconfig.json         # estricto, ES2022, paths: @/* -> src/*
├── tsconfig.build.json
├── nest-cli.json
├── .eslintrc.cjs         # eslint + prettier
├── .prettierrc
├── .gitignore            # incluye /dist, /.env, /coverage, /node_modules
├── .env.example          # clonado del actual + MINIMAX_API_KEY
└── README.md
```

**Dependencies clave:**
- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` (11.x)
- `@nestjs/config` (3.x)
- `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`
- `drizzle-orm`, `drizzle-kit`, `pg`
- `class-validator`, `class-transformer`
- `@nestjs/swagger`, `@scalar/nestjs-api-reference`
- `nestjs-pino`, `pino-pretty`
- `argon2` (hash de passwords, reemplazo moderno de bcrypt)
- Dev: `typescript`, `@types/node`, `@types/express`, `jest`, `supertest`, `@nestjs/testing`, `prettier`, `eslint`

## FASE 2 — Capa de infraestructura (30 min)

```
src/
├── main.ts                          # bootstrap con helmet, compression, cors, ValidationPipe global, Scalar
├── app.module.ts                    # raíz: ConfigModule, DatabaseModule, AuthModule, UsersModule, ReadingsModule, IaModule, HealthModule
├── config/
│   ├── env.validation.ts            # Zod schema, valida TODO al boot
│   ├── env.config.ts                # inyecta ConfigService tipado
│   ├── database.config.ts
│   ├── auth.config.ts               # JWT_SECRET, JWT_ACCESS_TTL, JWT_REFRESH_TTL
│   ├── ai.config.ts                 # MINIMAX_API_KEY, MINIMAX_MODEL, MINIMAX_ENDPOINT, DEFAULT_PROVIDER
│   └── app.config.ts                # PORT, HOST, NODE_ENV, API_PREFIX
├── common/
│   ├── filters/all-exceptions.filter.ts
│   ├── interceptors/logging.interceptor.ts
│   ├── interceptors/timeout.interceptor.ts
│   ├── pipes/zod-validation.pipe.ts
│   ├── decorators/current-user.decorator.ts
│   ├── decorators/public.decorator.ts
│   ├── decorators/roles.decorator.ts
│   ├── guards/jwt-auth.guard.ts
│   ├── guards/roles.guard.ts
│   ├── dto/pagination.dto.ts
│   └── types/api-response.type.ts          # interface base: { message, data, error? }
└── database/
    ├── database.module.ts                   # DrizzleModule.forRoot({ schema })
    ├── drizzle/
    │   ├── schema.ts                        # 4 tablas modeladas idénticas al init.sql
    │   ├── relations.ts                     # FK relationships
    │   └── types.ts                         # tipos inferidos
    └── README.md                            # explica: schema lo aplica infra
```

## FASE 3 — Capa de datos (20 min)

**Schema Drizzle** replica exacta de `infrastructure/database/postgres/01-init.sql`:

- `users` (id, full_name, email, password, current_streak, last_streak_date, created_at, updated_at, deleted_at)
- `auth_access_tokens` (id, tokenable_id, type, name, hash, abilities, created_at, updated_at, last_used_at, expires_at, deleted_at)
- `readings` (id, user_id, title, description, content, category, difficulty, word_count, status, score, passed, created_at, updated_at, deleted_at)
- `prompt_logs` (id, level, event, message, seed, user_id, text_id, params, system_prompt, user_prompt, error_message, error_stack, duration_ms, created_at)

## FASE 4 — Módulos de negocio (90 min)

### 4.1 AuthModule (20 min)

```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts                # POST /api/v1/auth/register, /login, /logout, /refresh, GET /me
├── auth.service.ts                   # register, login (access+refresh), logout, refresh, me
├── strategies/jwt.strategy.ts        # passport-jwt valida access token
├── guards/jwt-auth.guard.ts          # @UseGuards(JwtAuthGuard) global
├── dto/
│   ├── register.dto.ts               # @IsEmail, @IsString, @MinLength(8)
│   ├── login.dto.ts
│   └── refresh-token.dto.ts
└── tests/auth.service.spec.ts        # unit tests con Drizzle mock
```

**Mejoras sobre Adonis:**
- Refresh tokens (no existían) — v1 emitía solo access tokens
- Access TTL: 15 min, Refresh TTL: 30 días
- Passwords con argon2 (no bcrypt)

### 4.2 UsersModule (10 min)

```
src/modules/users/
├── users.module.ts
├── users.controller.ts               # GET /api/v1/user/streak?days=7
├── users.service.ts                  # getStreak(userId, days)
├── dto/streak-query.dto.ts
└── tests/users.service.spec.ts
```

**Lo que el mobile consume:** solo `/user/streak?days=N`. Sin más.

### 4.3 IaModule — el corazón (35 min) ✨ REFACTOR PROFUNDO

```
src/modules/ia/
├── ia.module.ts
├── ia.controller.ts                  # POST /api/v1/ia/chat, /api/v1/ia/chat/stream
├── ia.service.ts                     # orquesta provider activo, logging a prompt_logs
├── providers/
│   ├── ai-provider.interface.ts      # interface limpia: { name, streamChat(messages): AsyncIterable<string>, getFullResponse(messages): Promise<string> }
│   ├── ai-provider.factory.ts        # selecciona provider según config (default: minimax)
│   ├── ai-provider.registry.ts       # registro centralizado (futuro: añadir providers)
│   ├── MiniMax-M3.provider.ts         # implementación nueva con fetch + retry + timeout
│   ├── groq.provider.ts              # implementado pero no registrado
│   └── DTOs/chat-message.dto.ts
├── dto/chat-request.dto.ts
└── tests/
    ├── MiniMax-M3.provider.spec.ts   # tests con fetch mockeado
    └── ia.service.spec.ts
```

**Mejoras específicas:**
- **Strip thinking**: reescrito como `ThinkBlockParser` con tests unitarios, manejo robusto de tags partidos entre chunks
- **Retry con backoff** en errores 5xx de la API
- **Timeout configurable** (default 30s)
- **Logging estructurado** con `pino`: cada request loguea model, prompt_tokens, completion_tokens, duration_ms
- **Manejo de errores tipado**: `ProviderRateLimitError`, `ProviderAuthError`, `ProviderTimeoutError` (en `common/errors/`)
- **Soporte streaming** y **non-streaming** con misma interface

### 4.4 ReadingsModule — el más grande (20 min)

```
src/modules/readings/
├── readings.module.ts
├── readings.controller.ts            # GET /pending, /completed, /:id; POST /; POST /:id/evaluate; DELETE /:id; POST /:id/explanations
├── readings.service.ts               # store, getById, listPending, listCompleted, delete
├── prompt-generator.service.ts       # genera systemPrompt + userPrompt con random params
├── ai-response-parser.service.ts     # parsea JSON, normaliza category/difficulty
├── text.service.ts                   # CRUD + validación pending limit
├── explanation-prompt.service.ts     # genera prompt para explicaciones
├── streak.service.ts                 # calcula rachas
├── prompt-log.service.ts             # persiste logs
├── dto/
│   ├── generate-reading.dto.ts
│   ├── evaluate-reading.dto.ts
│   ├── create-explanation.dto.ts
│   └── pending-list.dto.ts
└── tests/
    ├── prompt-generator.service.spec.ts
    └── ai-response-parser.service.spec.ts
```

### 4.5 HealthModule (5 min)

```
src/modules/health/
├── health.module.ts
├── health.controller.ts              # GET /api/v1/health/live, /ready
└── health.service.ts                 # DB ping + memoria
```

## FASE 5 — Documentación con Scalar (10 min)

- En `main.ts`: `app.use('/docs', apiReference({ content: SwaggerModule.setup(app, ...) }))`
- Todos los controllers con `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`
- Resultado: `http://localhost:3333/docs` con la API completa y try-it-out

## FASE 6 — Lista final de endpoints de la nueva API

| Método | Path | Auth | Descripción |
|---|---|---|---|
| POST | `/api/v1/auth/register` | no | crea usuario |
| POST | `/api/v1/auth/login` | no | devuelve access + refresh tokens |
| POST | `/api/v1/auth/refresh` | no (refresh) | renueva access token |
| POST | `/api/v1/auth/logout` | sí | revoca refresh token |
| GET | `/api/v1/auth/me` | sí | info del usuario actual |
| GET | `/api/v1/user/streak?days=7` | sí | racha del usuario |
| POST | `/api/v1/readings` | sí | genera nueva lectura (llama MiniMax M3) |
| GET | `/api/v1/readings/pending` | sí | lista lecturas pendientes |
| GET | `/api/v1/readings/completed` | sí | lista lecturas completadas |
| GET | `/api/v1/readings/:id` | sí | detalle de una lectura |
| POST | `/api/v1/readings/:id/evaluate` | sí | evalúa respuesta del usuario |
| DELETE | `/api/v1/readings/:id` | sí | elimina lectura |
| POST | `/api/v1/readings/:id/explanations` | sí | genera explicación de palabras |
| POST | `/api/v1/ia/chat` | sí | chat crudo con el provider activo |
| GET | `/api/v1/health/live` | no | liveness probe |
| GET | `/api/v1/health/ready` | no | readiness probe (incluye DB) |
| GET | `/docs` | no | documentación Scalar |

**Total: 16 endpoints + 1 doc.** El mobile consume 12 de los 16. Los 4 extra (refresh, ia/chat, health) son para admin/monitoring.

## FASE 7 — Validación E2E (45 min)

1. `npm run build` (0 errores TS)
2. `npm run lint:check` (0 errores)
3. Levantar dev (`localhost:3333`), conectado al Postgres de TEST
4. E2E con curl:
   - register → login → me → refresh → logout
   - streak?days=7
   - generate reading (MiniMax M3) → assert JSON válido
   - list pending → list completed
   - get reading by id
   - evaluate
   - generate explanation
   - delete reading
   - health/live + health/ready
5. Verificar Scalar: `GET /docs` → renderiza

## FASE 8 — Promoción dev (15 min)

1. Commit con mensaje detallado
2. `git checkout dev && git merge --no-ff feature/migrate-to-nest`
3. `git push origin dev`
4. **NO tocar prod sin tu OK**

## FASE 9 — Promoción a prod (cuando me digas)

1. Rebuild imagen: `docker compose ... build backend-dolynglish`
2. Levantar: `docker compose ... up -d backend-dolynglish`
3. Mismo E2E que FASE 7 contra `localhost:57001`
4. Confirmar: lecturas reales, auth funciona, Scalar visible

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El `stripThinking` se rompe en el rewrite | Tests unitarios E2E con el prompt largo del controller ANTES de promover |
| Schema Drizzle diverge del init.sql | Test al boot que compara columnas y aborta si difiere |
| JWT cambia formato y rompe tokens guardados del mobile | v1 emitía tokens con `oat_` prefix propio. Decisión: usar JWT estándar sin prefix (mobile lo lee con Bearer) |
| argon2 falla en el contenedor prod | Compilar `argon2` con `--build-from-source` o usar `@node-rs/argon2` (Rust prebuilt) |
| Mobile se rompe porque los paths cambiaron | E2E completo antes de promover. Mobile se actualiza después como fase 10 opcional |

## Lo que necesito de ti

1. **OK al plan actualizado** ← estás leyendo
2. (Nada más — ya tenemos: rama, auth, ORM, docs, mejoras)

## Pregunta abierta

**Sobre el JWT actual**: el Adonis usa `oat_*** (Opaque Access Token de Adonis Auth) que NO es un JWT estándar. Si quieres que el mobile siga funcionando sin re-login, necesitaríamos mantener compatibilidad con tokens `oat_` viejos durante un tiempo. ¿OK si la nueva API usa JWT estándar y los usuarios tienen que re-logearse al actualizar?**

Si quieres que NO haya re-login, puedo poner un endpoint `/auth/legacy-exchange` que acepte un `oat_` viejo y devuelva un JWT nuevo. Pero eso es 30 min extra.

**¿Avanzamos con FASE 1 (bootstrap Nest) ahora?**
