# Cómo contribuir

Gracias por sumarte al equipo de Dolynglish. Esta guía resume el flujo de
trabajo en cinco líneas. Para el detalle, sigue los enlaces.

1. **Clona** el repo: `git clone git@github.com:SebastianRdzC04/dolynglish.git`
2. **Instala** dependencias: `cd backend && npm ci`
3. **Levanta** el entorno local ([onboarding/setup.md](./onboarding/setup.md))
4. **Crea una rama** desde `dev`: `git checkout -b feature/<nombre-kebab>`
5. **Abre un PR** contra `dev` siguiendo la [plantilla](../.github/PULL_REQUEST_TEMPLATE.md)

## Convenciones obligatorias

- [Git workflow](./conventions/git-workflow.md) — flujo de ramas, hotfixes.
- [Conventional Commits](./conventions/commits.md) — formato de mensajes.
- [API contracts](./conventions/api-contracts.md) — envelope `{ message, data, error? }`.
- [Code style](./conventions/code-style.md) — TypeScript estricto, ESLint, Prettier.
- [Testing](./conventions/testing.md) — qué testear y cómo.

Antes de commitear:

```bash
cd backend
npm run verify    # typecheck + lint:check + format:check + test
```

El comando `verify` es la red mínima local; el CI en GitHub Actions añade la
suite e2e, el guard de OpenAPI y el build de producción.

## Reportar bugs o pedir features

Usa las plantillas en `.github/ISSUE_TEMPLATE/`. Para bugs, incluye pasos
para reproducir y comportamiento esperado vs. observado.