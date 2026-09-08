# Onboarding — añadir un código de error

Cuándo y cómo extender el catálogo `ErrorCode`. Es un cambio pequeño pero
crítico: el catálogo es la **única** fuente de verdad que el cliente puede
switchear para tomar decisiones.

## Cuándo necesitas un código nuevo

- Una nueva condición de fallo de negocio que no encaja en los códigos
  existentes.
- Un endpoint nuevo puede fallar de formas que un código genérico
  (`RESOURCE_NOT_FOUND`, `VALIDATION_ERROR`) no describe bien.

**Cuándo NO necesitas uno:**

- Mapeas una `HttpException` de Nest a un código existente.
- Tu error es interno (`throw new Error(...)`) → se mapea automáticamente
  a `INTERNAL_ERROR`.

## Paso 1: Añadir el enum

[`backend/src/common/errors/error-codes.ts`](../../backend/src/common/errors/error-codes.ts):

```ts
export enum ErrorCode {
  // ... existentes ...

  /** Nuevo: el ejemplo alcanzó su límite */
  EXAMPLE_LIMIT_REACHED = 'EXAMPLE_LIMIT_REACHED',
}
```

Convención de naming: `<DOMINIO>_<CONDICION>` en `UPPER_SNAKE_CASE`.

## Paso 2: Añadir la metadata

En el mismo archivo, dentro de `ErrorCatalog`:

```ts
[ErrorCode.EXAMPLE_LIMIT_REACHED]: {
  code: ErrorCode.EXAMPLE_LIMIT_REACHED,
  status: 400,
  message: 'You have reached the maximum number of examples. Delete some before creating more.',
},
```

**Reglas del `message`:**

- En inglés.
- Legible para el usuario final (se muestra en el cliente).
- **Nunca** incluya SQL, paths, secrets, IDs internos.
- Primera letra mayúscula, sin punto final.

**Reglas del `status`:**

- `4xx` para errores del cliente (input inválido, conflictos, no encontrado).
- `5xx` para errores del servidor.
- Usar el status HTTP estándar más cercano.

## Paso 3: El test exhaustivo te avisa

El test [`error-codes.spec.ts`](../../backend/src/common/errors/error-codes.spec.ts)
verifica que **cada** entrada del enum tiene metadata. Si te olvidaste del
Paso 2, este test falla:

```
ErrorCatalog is missing entries for: EXAMPLE_LIMIT_REACHED
```

Corrígelo antes de continuar.

## Paso 4: Usar el código

```ts
throw new AppHttpException(
  ErrorCode.EXAMPLE_LIMIT_REACHED,
  'You have 5 examples, delete one first',
);
```

El segundo parámetro (mensaje específico) es opcional — úsalo si el
mensaje del catálogo no describe bien la situación concreta. Recuerda:
este mensaje sí viaja al cliente.

## Paso 5: Documentar

Añade una fila a la tabla en
[`docs/conventions/api-contracts.md`](../conventions/api-contracts.md#catálogo-de-códigos-de-error)
con el código, HTTP status y significado. Los códigos son parte del
contrato público y el cliente los lee.

## Paso 6: Verificar

```bash
cd backend
npm run verify
```

Si todo pasa, commit con mensaje tipo
`feat(example): add EXAMPLE_LIMIT_REACHED error code`.