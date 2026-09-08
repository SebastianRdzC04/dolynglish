# DB updates

Esta carpeta contiene los cambios al schema que **se aplican después del
primer deploy a producción**. Antes del primer deploy, los cambios van
directamente en `01-init.sql`.

> **¿Por qué existe esta carpeta?**
>
> Después de que `prod` corre por primera vez con el schema de
> `01-init.sql`, ese SQL no se vuelve a ejecutar — el volumen de Postgres
> persiste los datos y el entrypoint del contenedor ignora
> `initdb.d/` en arranques posteriores. Cualquier cambio al schema en
> prod tiene que llegar como un `ALTER` en un archivo que corra en un
> momento controlado (manual o por un job de migraciones a futuro).
>
> Por eso los archivos de update viven aquí, en orden alfabético =
> cronológico.

## Convención de nombres

```
YYYY-MM-DD_<short-kebab-name>.sql
```

- **Fecha** en formato `YYYY-MM-DD` (la fecha del PR, no la fecha
  original del cambio)
- **Nombre corto** en kebab-case, descriptivo del cambio

Ejemplo: `2026-09-08_add-user-response-to-readings.sql`

## Orden de aplicación

Archivos se ejecutan en **orden alfabético** (= orden cronológico por
nombre `YYYY-MM-DD_...`). Si dos archivos tienen la misma fecha, el
orden entre ellos es por nombre kebab.

> **No** renombrar archivos después de que se hayan aplicado a prod —
> el orden de aplicación cambia.

## Regla de idempotencia (obligatoria)

Todos los statements deben ser **idempotentes** para que el mismo set
pueda ejecutarse más de una vez sin romper la BD:

```sql
-- ✅ idempotente — se puede correr N veces
CREATE TABLE IF NOT EXISTS readings (
  ...
);
ALTER TABLE readings ADD COLUMN IF NOT EXISTS user_response TEXT;
CREATE INDEX IF NOT EXISTS idx_readings_user ON readings(user_id);

-- ❌ NO idempotente — rompe si se corre dos veces
CREATE TABLE readings (...);
ALTER TABLE readings ADD COLUMN user_response TEXT;
DROP INDEX idx_X;
```

Patrones soportados en Postgres 15:

- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `CREATE UNIQUE INDEX IF NOT EXISTS`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `ALTER TABLE ... ALTER COLUMN ... SET NOT NULL`
- `ALTER TABLE ... ADD CONSTRAINT ... CHECK (...)`
- `DROP TABLE IF EXISTS`
- `DROP INDEX IF EXISTS`

No soportado en Postgres 15 (usar con cuidado):

- `ALTER TABLE ... DROP COLUMN IF EXISTS` (Postgres 16+)

## Workflow

Para agregar un cambio nuevo:

1. **Crear el archivo aquí** con la fecha del PR de hoy en el nombre
2. Actualizar `01-init.sql` para que su `CREATE TABLE` incluya el
   estado final (mismo estado que el update produce)
3. Commit ambos en el mismo PR con un mensaje `feat(db): <description>`
4. Si hay cambios de código backend que usan la nueva estructura, van
   en commits separados

Detalles completos en
[`docs/conventions/database.md`](../../../docs/conventions/database.md#cambios-al-schema-regla-de-dos-fases).

## Ejemplo de archivo

`2026-09-08_add-user-response-to-readings.sql`:

```sql
-- 2026-09-08: Echo the user's response back so the mobile client
-- can render the original answer next to the AI feedback.
ALTER TABLE readings ADD COLUMN IF NOT EXISTS user_response TEXT;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE readings ALTER COLUMN user_response SET DEFAULT NULL;
```

## Estado actual

`prod` aún no se ha desplegado (este proyecto está en desarrollo). Por
eso la carpeta está vacía más allá de este README.

Los updates empezarán a vivir aquí a partir del primer deploy a
producción.
