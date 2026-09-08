# Onboarding — setup local

Cómo levantar el backend de Dolynglish desde cero en tu máquina.

## Requisitos

- **Node.js ≥ 22.0.0** (recomendado: usar [nvm](https://github.com/nvm-sh/nvm))
- **npm ≥ 11.0.0**
- **Docker + Docker Compose** (para PostgreSQL)
- **Git** con SSH configurado para GitHub

Verifica tu entorno:

```bash
node --version    # v22.x.x
npm --version     # 11.x.x
docker --version
```

## Clonar el repo

```bash
git clone git@github.com:SebastianRdzC04/dolynglish.git
cd dolynglish
```

## Instalar dependencias del backend

```bash
cd backend
npm ci
```

`npm ci` es estricto con el lockfile. Si necesitas actualizar
dependencias, usa `npm install <pkg>` y commitea el `package-lock.json`
resultante.

## Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y rellena **al menos**:

- `JWT_SECRET` — genera con `openssl rand -base64 48`
- `DB_PASSWORD` — la que pusiste en el compose de Postgres
- `MINIMAX_API_KEY` — obtén del panel de MiniMax-M3
- `AI_DEFAULT_PROVIDER` — `minimax` o `groq`

El resto tiene defaults razonables.

## Levantar PostgreSQL en local

El repo incluye un compose de Postgres standalone:

```bash
cd ../infrastructure
docker compose -f docker-compose.test.yml up -d
```

Verifica:

```bash
docker ps             # el contenedor 'dolynglish-postgres-test' debe estar 'healthy'
docker logs dolynglish-postgres-test   # debe mostrar 'database system is ready'
```

El schema (`01-init.sql`) se aplica **automáticamente** al primer arranque.

## Levantar el backend en modo desarrollo

```bash
cd ../backend
npm run start:dev
```

Deberías ver en logs:

```
Application listening on http://0.0.0.0:3333
API documentation: http://0.0.0.0:3333/docs
```

## Verificar que todo funciona

En otra terminal:

```bash
# Health check
curl http://localhost:3333/api/v1/health/live

# Scalar docs en el navegador
open http://localhost:3333/docs

# OpenAPI JSON
curl http://localhost:3333/api/v1/openapi.json | head -50
```

## Correr los tests

```bash
cd backend
npm run verify    # typecheck + lint + format + test (todo en uno)
```

O paso a paso:

```bash
npm run typecheck     # tsc --noEmit
npm run lint:check    # ESLint
npm run format:check  # Prettier
npm run test          # Jest (unit + e2e)
```

## Solución de problemas

### `EADDRINUSE: address already in use :::3333`

Otro proceso está usando el puerto. Encuentra y mata:

```bash
lsof -ti:3333 | xargs kill -9
```

### `ECONNREFUSED 127.0.0.1:5432` (o el puerto que uses)

Postgres no está corriendo. Levanta el contenedor:

```bash
cd infrastructure && docker compose -f docker-compose.test.yml up -d
```

### Los tests fallan con errores de Drizzle

Verifica que `01-init.sql` se aplicó:

```bash
docker exec -it dolynglish-postgres-test psql -U postgres -d dolynglish_test -c "\dt"
```

Deberías ver 4 tablas: `users`, `auth_access_tokens`, `readings`, `prompt_logs`.

Si faltan, recrea el contenedor:

```bash
docker compose -f docker-compose.test.yml down -v
docker compose -f docker-compose.test.yml up -d
```

### Hooks de git no se ejecutan

Si tienes los hooks configurados pero no corren:

```bash
cd backend && npx husky
```

## Próximos pasos

- Lee [conventions/code-style.md](../conventions/code-style.md)
- Lee [conventions/api-contracts.md](../conventions/api-contracts.md)
- Lee [conventions/git-workflow.md](../conventions/git-workflow.md)
- Sigue [adding-endpoint.md](./adding-endpoint.md) para tu primer endpoint