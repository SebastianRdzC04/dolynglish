# Database

El backend usa **PostgreSQL 15** vía **Drizzle ORM** sobre el driver `pg`.

## Stack

- **PostgreSQL 15** (en dev, prod vía Docker).
- **node-postgres** (`pg` ^8.13) como driver.
- **Drizzle ORM** (`drizzle-orm` ^0.36) como query builder.
- **Sin migraciones desde el backend**: el schema se aplica vía SQL crudo.

## Schema: decisión intencional

El schema completo vive en
[`infrastructure/database/postgres/01-init.sql`](../../infrastructure/database/postgres/01-init.sql).
Se monta automáticamente como `/docker-entrypoint-initdb.d/01-init.sql` en el
contenedor de Postgres, por lo que se ejecuta **al primer arranque** del
contenedor.

**Por qué no usamos migraciones desde el backend:**

- Simplicidad operativa: el `docker compose up` es el único punto de
  provisionamiento.
- Menos tooling: no hace falta `drizzle-kit migrate` ni mantener el
  historial de migraciones.
- El equipo todavía está iterando rápido sobre el schema — un único SQL
  es más fácil de revisar que 30 migrations.

**Tradeoff asumido:** cualquier cambio de schema requiere recrear el
contenedor de Postgres en dev. En prod se haría con `psql -f 01-init.sql`
sobre la BD existente (con cuidado para no perder datos).

## Tablas actuales

| Tabla                 | Propósito                                                  |
| --------------------- | ---------------------------------------------------------- |
| `users`               | Cuentas de usuario (email, password_hash, streak, etc.)    |
| `auth_access_tokens`  | Refresh tokens persistidos con hash                        |
| `readings`            | Lecturas generadas + respuestas del usuario + feedback IA  |
| `prompt_logs`         | Auditoría de prompts enviados al LLM                       |

## Convenciones de nombres

| Capa                  | Convención        | Ejemplo                         |
| --------------------- | ----------------- | ------------------------------- |
| Tablas SQL            | `snake_case`      | `auth_access_tokens`            |
| Columnas SQL          | `snake_case`      | `password_hash`, `created_at`   |
| Variables TS          | `camelCase`       | `passwordHash`, `createdAt`     |
| Archivos TS           | `kebab-case`      | `auth-access.tokens.ts`         |

El mapping snake_case ↔ camelCase se declara explícitamente en
[`backend/src/database/drizzle/schema.ts`](../../backend/src/database/drizzle/schema.ts).

## Añadir una columna

1. Editar `infrastructure/database/postgres/01-init.sql`.
2. Actualizar el schema Drizzle en
   [`backend/src/database/drizzle/schema.ts`](../../backend/src/database/drizzle/schema.ts).
3. Si afecta tipos públicos, actualizar el `*Dto` correspondiente.
4. Verificar que `npm run verify` pasa.

## Añadir una tabla nueva

1. Añadir `CREATE TABLE` en `01-init.sql`.
2. Definir el schema en `backend/src/database/drizzle/schema.ts`.
3. Si hay relaciones con otras tablas, declararlas en
   [`backend/src/database/drizzle/relations.ts`](../../backend/src/database/drizzle/relations.ts).
4. Crear un módulo de Nest que la use (controller + service).

## Drizzle types

- Tipos inferidos: `typeof usersTable.$inferSelect` / `$inferInsert`.
- Helpers de columnas: `pgTable`, `pgEnum`, `uuid`, `text`, `timestamp`,
  `integer`, etc. (todo en `drizzle-orm/pg-core`).

## Conexión

- Provider global vía [`backend/src/database/database.module.ts`](../../backend/src/database/database.module.ts).
- Token `DRIZZLE` exportado en [`backend/src/database/database.tokens.ts`](../../backend/src/database/database.tokens.ts).
- En tests, mockear el provider con un objeto que expone `.select()`,
  `.insert()`, etc.