# Feature Specifications

Spec-driven development (SDD) source of truth for the Todo Speckit project.  
No application code may be written unless it maps to a requirement in one of these files.

## Sprint order

| Sprint | File | Branch | Merge into | Depends on |
|--------|------|--------|------------|------------|
| 1 | [sprint-1-user-auth.md](./sprint-1-user-auth.md) | `feature/sprint-1-user-auth` | `dev` | — |
| 2 | [sprint-2-todo-list-management.md](./sprint-2-todo-list-management.md) | `feature/sprint-2-todo-list-management` | `dev` | Sprint 1 on `dev` |
| 3 | [sprint-3-todo-list-item-management.md](./sprint-3-todo-list-item-management.md) | `feature/sprint-3-todo-list-item-management` | `dev` | Sprints 1–2 on `dev` |

**Branch roles:** `main` = scaffold-only starter kit · `dev` = integration (branch from `main`, merge sprints here) · `feature/sprint-*` = sprint implementation (branch from `dev`).

## Implementation order (each sprint)

1. Backend models and associations
2. Backend routes, controllers, authorization helpers
3. Backend tests (Jest + supertest)
4. Frontend services (`*Services.js`, axios client)
5. Frontend views and components
6. Frontend tests (Vitest + `@vue/test-utils`)
7. Router updates and manual verification

## Related project docs

*   Cursor rules: `.cursor/rules/`
*   Backend env: `backend/.env` (copy from `backend/.env.example`)
*   Test env: `backend/.env.test` (copy from `backend/.env.test.example`)
*   UI references (optional): `docs/ui/` — link Figma exports from each sprint spec

## Running tests

```bash
npm test                 # from repo root — backend + frontend
npm run test:backend     # Jest
npm run test:frontend    # Vitest
```
