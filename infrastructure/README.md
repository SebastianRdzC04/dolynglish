# Infrastructure

Servicios dockerizados para Dolynglish: PostgreSQL en dev/test/prod y el
backend en producción.

## Archivos

```
infrastructure/
├── docker-compose.test.yml    # Postgres standalone (tests + dev local)
├── docker-compose.prod.yml    # Postgres + backend (producción)
└── database/
    └── postgres/
        └── 01-init.sql        # Schema completo, se aplica al primer arranque
```

## Levantar Postgres para desarrollo / tests

```bash
docker compose -f docker-compose.test.yml up -d
```

El contenedor expone Postgres en `localhost:57000` (puerto host) →
`5432` (puerto container). El schema se aplica automáticamente al primer
arranque desde `01-init.sql`.

Variables en [`infrastructure/.env.example`](./.env.example):

```env
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=dolynglish_test
DB_PORT=57000
```

## Desplegar backend en producción

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Levanta dos servicios:

- `postgres` — Postgres 15 con el schema aplicado (puerto host 57000).
- `backend` — construye desde `../backend/Dockerfile`, expone puerto 3333
  como 57001.

Las variables de entorno del backend se pasan vía `${...}` desde el
`.env` raíz. Ver [`backend/.env.example`](../backend/.env.example) para la
lista completa.

## Verificar

```bash
# Estado de los contenedores
docker compose -f docker-compose.test.yml ps

# Conectar a la BD
docker exec -it dolynglish-postgres-test psql -U postgres -d dolynglish_test

# Ver tablas
docker exec -it dolynglish-postgres-test psql -U postgres -d dolynglish_test -c "\dt"

# Logs
docker compose -f docker-compose.test.yml logs -f postgres
```

## Reset completo

Para empezar de cero (incluyendo los datos):

```bash
docker compose -f docker-compose.test.yml down -v
docker compose -f docker-compose.test.yml up -d
```

El `-v` borra los volúmenes (datos persistidos). El contenedor recreará
el schema al arrancar.

## Schema SQL

El schema completo vive en
[`database/postgres/01-init.sql`](./database/postgres/01-init.sql). Para
añadir tablas o columnas, editar ese archivo y recrear el contenedor (o
aplicar manualmente con `psql -f 01-init.sql`).

Política completa en
[`docs/conventions/database.md`](../docs/conventions/database.md).