# Git workflow

Este documento define cómo se mueve el código entre ramas. Es la fuente de
verdad para PRs, merges y hotfixes.

## Diagrama de flujo

```
                     ┌──────────────────┐
                     │   feature/*      │
                     │   fix/*          │
                     │   chore/*        │
                     └────────┬─────────┘
                              │  PR + checks
                              ▼
                     ┌──────────────────┐
                     │      dev         │  ← integración diaria
                     └────────┬─────────┘
                              │  PR + 1 review CODEOWNER + checks
                              ▼
                     ┌──────────────────┐
                     │      prod        │  ← producción
                     └──────────────────┘

                     ┌──────────────────┐
                     │      main        │  ← legacy AdonisJS, INERTE
                     └──────────────────┘
```

## Convenciones de nombres

- `feature/<kebab>` — nuevas funcionalidades
- `fix/<kebab>` — correcciones
- `chore/<kebab>` — refactors, limpieza, tooling

Sin número de issue, sin prefijos de autor. Ejemplos:

- `feature/prompt-builder-difficulty`
- `fix/openapi-prefix-bug`
- `chore/remove-archived-backend`

Máximo 50 caracteres en total.

## Reglas por rama

### `dev` (integración diaria)

- Recibe PRs de `feature/*`, `fix/*`, `chore/*`.
- Requiere **status checks** verdes antes de mergear (CI de GitHub Actions).
- Squash-merge para mantener historia lineal.
- No se permiten force-pushes ni deleciones.
- Linear history obligatorio.

### `prod` (producción)

- Recibe PRs **únicamente** desde `dev` (excepto hotfixes).
- Requiere status checks verdes **más** 1 aprobación de CODEOWNER.
- Squash-merge.
- Solo `@SebastianRdzC04` puede mergear directamente (`restrictions`).
- No se permiten force-pushes ni deleciones.

### `main` (legacy, INERTE)

Es la rama default de GitHub heredada de la era AdonisJS. **No la uses.**

- No recibe PRs.
- No tiene protección activa.
- No se commitea contra ella.
- Si GitHub te la sugiere como base de un PR, cambia la base a `dev`.

## Procedimiento de hotfix

Para un fix urgente en producción:

1. Crea rama desde `prod`:
   ```bash
   git checkout prod
   git checkout -b fix/<nombre-descriptivo>
   ```
2. Commitea el fix mínimo (ver [commits.md](./commits.md)).
3. Abre PR con título `[HOTFIX] <descripción>` directo contra `prod`.
4. Después de mergearlo en `prod`, **cherry-pick** el commit a `dev`:
   ```bash
   git checkout dev
   git cherry-pick <sha-del-hotfix>
   git push origin dev
   ```

## Política de merges

- **Squash-merge** en `dev` y `prod` para mantener la historia lineal.
- Commits locales en feature branches pueden ser múltiples; el squash
  los colapsa en uno al mergear.
- Títulos de PR siguen Conventional Commits (ver [commits.md](./commits.md)).

## Pull requests

Usa la plantilla en [`.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md).
Cada PR debe tener su checklist marcado antes de pedir review:
`npm run verify` pasa, tests añadidos, envelope respetado, etc.