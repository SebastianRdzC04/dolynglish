<!--
Thanks for the PR! Please fill out the sections below so reviewers have
context. The CI must pass before this can be merged — see
docs/conventions/git-workflow.md for the rules.
-->

## Resumen

<!-- 1-3 bullets: what does this PR do and why? -->

-

## Tipo de cambio

<!-- Marca lo que aplique. -->

- [ ] `feat` — Nueva funcionalidad
- [ ] `fix` — Corrección de bug
- [ ] `refactor` — Cambio de código sin nueva funcionalidad
- [ ] `docs` — Solo documentación
- [ ] `test` — Solo tests
- [ ] `chore` — Mantenimiento (deps, build, configs)
- [ ] `perf` — Mejora de rendimiento
- [ ] `ci` — Cambios en CI

## Issue / contexto

<!-- Enlace al issue o descripción del bug. "Refs: #123" o "Fixes #456". -->

## Cambios principales

<!-- Lista de archivos o áreas clave tocadas. -->

-

## Checklist

<!-- Marca lo que aplique. Items no marcados requerirán explicación en review. -->

- [ ] `cd backend && npm run verify` pasa localmente
- [ ] Tests añadidos o actualizados (cubren el cambio)
- [ ] Si cambié la API: DTOs documentados con `@ApiProperty` (en inglés)
- [ ] Si cambié la API: el endpoint devuelve el envelope `{ message, data, error? }` via `apiOk`
- [ ] Si añadí un código de error: está en el enum `ErrorCode` y en `ErrorCatalog`
- [ ] Si cambié la API: actualicé `docs/conventions/api-contracts.md` si aplica
- [ ] Si añadí un script: actualicé la tabla en `backend/README.md`
- [ ] Sin secretos, `.env`, ni archivos generados en el diff
- [ ] Commits siguen Conventional Commits (verificado por commitlint)

## Screenshots / logs

<!-- Opcional: capturas si es UI, logs si es backend. -->

## Notas para el reviewer

<!-- Cualquier contexto adicional, decisiones de diseño, tradeoffs. -->