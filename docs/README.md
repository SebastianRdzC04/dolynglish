# Dolynglish — Documentación

Dolynglish es una aplicación móvil de práctica de inglés que genera ejercicios
de lectura con IA y evalúa las respuestas del usuario. Este repositorio
contiene el backend activo (NestJS), el cliente móvil (Expo / React Native,
actualmente deshabilitado) y la infraestructura dockerizada.

## Estructura del repositorio

| Carpeta             | Contenido                                                    | Estado              |
| ------------------- | ------------------------------------------------------------ | ------------------- |
| `backend/`          | API REST en NestJS 11 + Drizzle ORM + PostgreSQL             | Activo              |
| `mobile/`           | Cliente Expo SDK 54 / React Native                           | Deshabilitado       |
| `infrastructure/`   | Docker Compose para Postgres + backend en producción         | Activo              |
| `docs/`             | Esta documentación                                           | Activo              |
| `.github/`          | Workflows de CI, plantillas de PR, CODEOWNERS                | Activo (este PR)    |

## Índice de la documentación

- **Entrada rápida**: [CONTRIBUTING.md](./CONTRIBUTING.md) — clonar,
  instalar, contribuir, abrir un PR.
- **Convenciones** (cómo escribir código, commits, PRs): [conventions/](./conventions/README.md)
- **Arquitectura**: [architecture/](./architecture/README.md)
- **Onboarding**: [onboarding/](./onboarding/README.md)

## Documentación adicional

- `backend/README.md` — quick start, scripts, arquitectura del backend.
- `backend/TYPESCRIPT_STANDARDS.md` — reglas no negociables de TypeScript.
- `backend/.env.example` — variables de entorno requeridas.
- `infrastructure/README.md` — servicios dockerizados.

## Estado del repositorio

- Backend: activo y desplegado.
- Mobile: pausado hasta nuevo aviso.
- `backend-adonis-bak/`: eliminado (la migración a Nest está completa).

## Licencia

`UNLICENSED` — proyecto privado.