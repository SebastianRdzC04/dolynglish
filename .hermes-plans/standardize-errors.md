# Plan: Estandarización de respuestas y errores del API

**Fecha:** 2026-08-28
**Rama:** `feature/standardize-errors`
**Convención (regla del usuario):** `{ message, data, error? }` con códigos estables

## FASE 1 — Catálogo de códigos de error y respuesta unificada (30 min)

1. Crear `src/common/errors/error-codes.ts` con `ErrorCode` enum (AUTH_INVALID_CREDENTIALS, USER_NOT_FOUND, READING_PENDING_LIMIT_REACHED, etc.)
2. Refactor `ApiResponse` para que `error.code` sea del enum
3. Tests: cada código de error existe y tiene un mensaje humano legible

## FASE 2 — Filtro de errores blindado (45 min)

1. Reescribir `AllExceptionsFilter`:
 - `INTERNAL_ERROR` (500) → log con todo el contexto (para devs), responde solo `message: "An unexpected error occurred"` y `code: "INTERNAL_ERROR"`. **Nunca** leakear el `exception.message` ni stack al cliente.
 - `HttpException` conocidas (`BadRequestException`, `UnauthorizedException`, `NotFoundException`, `ConflictException`, `ForbiddenException`) → usar códigos del enum
 - Validación de DTOs (`BadRequestException` con array) → `code: "VALIDATION_ERROR"`, `details: { fields: [{ field, message }] }`
 - Errores de DB (`drizzle`, `pg`) → log, responde con `code: "INTERNAL_ERROR"`, no leakear query SQL
2. Tests:
 - Un 404 NotFoundException → `{ code: "RESOURCE_NOT_FOUND", message: "Reading not found" }`, NO `exception.message` filtrado
 - Un `new Error("DB connection string: postgres://user:secret@...")` → responde solo `code: "INTERNAL_ERROR"`, no leakear
 - Validación con campos faltantes → `details.fields` con la lista

## FASE 3 — Aplicar el estándar a TODOS los controllers (45 min)

1. Auditar cada endpoint: ¿devuelve `apiOk` o un dato crudo? Estandarizar.
2. Reemplazar `new NotFoundException('...')` por `new AppHttpException(ErrorCode.X, '...')`
3. Reemplazar `new BadRequestException('You have 3 pending readings...')` por códigos específicos
4. Cada controller debe tener `@ApiOkResponse({ type: <DtoClase> })` y `@ApiBadRequestResponse({ type: ApiErrorDto })` etc.
5. Tests: cada controller devuelve ApiResponse envelope, los errores mapean al código correcto

## FASE 4 — DTO de error + OpenAPI (30 min)

1. `ApiErrorResponseDto` documentado con `@ApiProperty`
2. `@ApiResponse` decorators en cada controller method (200, 400, 401, 404, 409, 500)
3. Test: cada endpoint tiene TODAS las respuestas documentadas en el schema

## Riesgos identificados

- Riesgo 1: cambiar el shape de respuesta rompe el mobile app. **Mitigación:** contrato de error más rico (más campos) no rompe nada. `data` puede seguir siendo el mismo objeto.
- Riesgo 2: los tests existentes (38) usan `expect(result.id).toBe(1)` directamente. Si envuelvo en `data:`, rompo. **Mitigación:** NO cambio `data` a un sub-objeto, mantengo el patrón actual donde los controllers ya devuelven `apiOk(message, data)`. Solo refactorizo cómo se construyen los errores.

## Plan de promoción (después de FASE 4)

1. `npm run verify` → 0 errores
2. E2E con curl contra dev: register, /me, /readings (happy + error 400 por límite pendiente)
3. `git push origin dev` → `git reset --hard origin/dev` en prod local → `docker compose build --no-cache` → `docker compose up -d --force-recreate` → E2E contra prod
4. Confirmo al usuario con health check + lectura real