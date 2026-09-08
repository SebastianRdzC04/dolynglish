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
        ├── 01-init.sql                 # Schema completo (se aplica al primer arranque)
        └── updates/                    # Cambios post-primer-deploy a prod
            ├── README.md               # Convención de updates (idempotencia, naming)
            └── YYYY-MM-DD_*.sql        # ALTERs cronológicos
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
[`database/postgres/01-init.sql`](./database/postgres/01-init.sql). Se
aplica automáticamente al primer arranque del contenedor de Postgres
(vía `/docker-entrypoint-initdb.d/`). En arranques posteriores no se
vuelve a aplicar.

### Cambios al schema: regla de dos fases

- **Mientras `prod` no se ha desplegado** (estamos en dev puro):
  editar directamente `01-init.sql` con el estado final deseado.
- **Después del primer deploy a `prod`**: NO editar `01-init.sql`;
  crear archivos `updates/YYYY-MM-DD_<nombre>.sql` con `ALTER`s
  idempotentes. Se aplican en orden alfabético (= cronológico).

Detalles completos en
[`docs/conventions/database.md`](../docs/conventions/database.md) y en
[`database/postgres/updates/README.md`](./database/postgres/updates/README.md).

Política completa en
[`docs/conventions/database.md`](../docs/conventions/database.md).