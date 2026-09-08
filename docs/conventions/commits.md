# Commits

El proyecto sigue [Conventional Commits](https://www.conventionalcommits.org/).
Los mensajes se validan automáticamente con commitlint vía git hooks (ver
[code-style.md](./code-style.md)).

## Estructura del mensaje

```
<type>(<scope>): <subject en inglés, imperativo, ≤72 chars>

<body opcional, wrap a 72 chars>

<footer opcional>
```

## Tipos permitidos

| Tipo       | Cuándo usarlo                                                |
| ---------- | ------------------------------------------------------------ |
| `feat`     | Nueva funcionalidad visible para el usuario final o la API    |
| `fix`      | Corrección de bug                                             |
| `refactor` | Cambio de código que no añade feature ni arregla bug          |
| `docs`     | Solo cambios en documentación                                |
| `test`     | Solo añadir o corregir tests                                  |
| `chore`    | Tareas de mantenimiento (deps, build, configs) sin impacto   |
| `build`    | Cambios en build system o dependencias externas               |
| `ci`       | Cambios en CI/CD pipelines                                   |
| `perf`     | Mejora de rendimiento                                        |
| `style`    | Cambios de formato que no afectan lógica (espacios, comillas) |

Para breaking changes, añade `!` después del tipo: `feat(api)!: remove v1 routes`.

## Scopes usados en el repo

Lista cerrada — usa uno de estos o crea uno nuevo documentándolo:

`auth`, `readings`, `ia`, `users`, `errors`, `docs`, `deps`, `db`,
`prod`, `infra`, `cleanup`, `repo`

## Reglas de formato

1. **Subject en inglés**, tiempo presente, imperativo:
   - ✅ `feat(readings): echo userResponse in EvaluationResultDto`
   - ❌ `Added a new field` / `WIP` / `updates`

2. **≤72 caracteres** en subject. Si necesitas más, muévelo al body.

3. **Body** opcional, separado del subject por línea en blanco. Wrap a 72 chars.

4. **Footer** para referencias:
   ```
   Refs: #123
   Co-Authored-By: Claude Code <noreply@anthropic.com>
   ```

## Regla de oro: commits pequeños

> Aunque se acumulen cambios en muchos archivos, **divide el trabajo en
> varios commits enfocados** (uno por concern).

Ejemplos válidos:

- ✅ `chore(cleanup): remove archived AdonisJS backend`
- ✅ `chore(infra): drop AdonisJS references from build configs`
- ✅ `docs(readings): strip legacy AdonisJS mentions from code comments`

Cada uno con un scope claro, una intención clara y diff pequeño. Esto
facilita:

- **Code review**: revisar 3 commits enfocados es más rápido que uno de 80
  archivos.
- **Reverts**: si algo falla, sabes exactamente qué commit revertir.
- **Bisect**: cuando un bug aparece en `prod`, el `git bisect` es útil
  solo si los commits están enfocados.
- **Cherry-pick**: puedes llevar un fix a `prod` sin traer cambios
  colaterales.

## Ejemplos válidos

```
feat(readings): echo userResponse in EvaluationResultDto
fix(docs): align ApiSuccessEnvelopeDto with allOf pattern
refactor(readings): split prompt-generation + prompt-logs subdomains
chore(repo): formalize docs, CI/CD, automation
feat(api)!: drop v1 auth endpoints (BREAKING)
```

## Ejemplos inválidos (rechazados por commitlint)

```
WIP
updates
feat: changes
Fix login bug.
```