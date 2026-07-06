# Feature Specifications

Spec-driven development (SDD) source of truth for the Todo Speckit project.  
No application code may be written unless it maps to a requirement in one of these files.

## Sprint order

| Sprint | File                                                                             | Branch                                       | Merge into | Depends on           |
| ------ | -------------------------------------------------------------------------------- | -------------------------------------------- | ---------- | -------------------- |
| 1      | [sprint-1-user-auth.md](./sprint-1-user-auth.md)                                 | `feature/sprint-1-user-auth`                 | `dev`      | —                    |
| 2      | [sprint-2-todo-list-management.md](./sprint-2-todo-list-management.md)           | `feature/sprint-2-todo-list-management`      | `dev`      | Sprint 1 on `dev`    |
| 3      | [sprint-3-todo-list-item-management.md](./sprint-3-todo-list-item-management.md) | `feature/sprint-3-todo-list-item-management` | `dev`      | Sprints 1–2 on `dev` |
| 4      | [sprint-4-todo-user-profile-management.md](./sprint-4-todo-user-profile-management.md) | `feature/sprint-4-user-profile-management`   | `dev`      | Sprints 1–3 on `dev` |
| 5      | [sprint-5-todo-due-date.md](./sprint-5-todo-due-date.md)                               | `feature/sprint-5-todo-due-date`             | `dev`      | Sprints 1–3 on `dev` |

**Branch roles:** `main` = scaffold-only starter kit · `dev` = integration (branch from `main`, merge sprints here) · `feature/sprint-*` = sprint implementation (branch from `dev`).

## Living reference (current integrated state)

After sprints merge to `dev`, keep these snapshots in sync with the codebase:

| File | Purpose |
|------|---------|
| [reference/README.md](./reference/README.md) | How to maintain reference docs |
| [reference/data-model.md](./reference/data-model.md) | Current database tables and associations |
| [reference/api.md](./reference/api.md) | Current REST API under `/todo/` |

Sprint specs define **changes**; reference files describe **what exists now**.

## Implementation order (each sprint)

1. Backend models and associations
2. Backend routes, controllers, authorization helpers
3. Backend tests (Jest + supertest)
4. Frontend services (`*Services.js`, axios client)
5. Frontend views and components
6. Frontend tests (Vitest + `@vue/test-utils`)
7. Router updates and manual verification

## Related project docs

- Cursor rules: `.cursor/rules/`
- Living reference: `features/reference/` (data model + API snapshot on `dev`)
- Backend env: `backend/.env` (copy from `backend/.env.example`)
- Test env: `backend/.env.test` (copy from `backend/.env.test.example`)
- UI references (optional): `docs/ui/` — link Figma exports from each sprint spec

## Running tests

```bash
npm test                 # from repo root — backend + frontend
npm run test:backend     # Jest
npm run test:frontend    # Vitest
```

## Export rules & specs to PDF

Combine all Cursor rules (first) and feature specs (second) into one PDF:

```bash
npm install              # once — installs md-to-pdf at repo root
npm run specs:pdf
```

If PDF generation fails with a missing Chrome error, either use installed Google Chrome automatically (macOS) or run the one-time browser download:

```bash
npm run specs:pdf:setup
npm run specs:pdf
```

Output:

- `docs/todo-speckit-specs.md` — combined Markdown (rules, then specs)
- `docs/todo-speckit-specs.pdf` — PDF export

**Included files (in order):**

1. `.cursor/rules/constitution.mdc`
2. `.cursor/rules/project-structure.mdc`
3. `.cursor/rules/api-conventions.mdc`
4. `.cursor/rules/auth-patterns.mdc`
5. `.cursor/rules/frontend-services.mdc`
6. `.cursor/rules/security.mdc`
7. `.cursor/rules/testing-standards.mdc`
8. `.cursor/rules/ui-style-system.mdc`
9. `features/README.md`
10. `features/sprint-1-user-auth.md` through `sprint-5-todo-due-date.md`
11. `features/reference/README.md`, `data-model.md`, `api.md`

Manual alternative (no npm script):

```bash
cat .cursor/rules/constitution.mdc \
    .cursor/rules/project-structure.mdc \
    .cursor/rules/api-conventions.mdc \
    .cursor/rules/auth-patterns.mdc \
    .cursor/rules/frontend-services.mdc \
    .cursor/rules/security.mdc \
    .cursor/rules/testing-standards.mdc \
    .cursor/rules/ui-style-system.mdc \
    features/README.md \
    features/sprint-1-user-auth.md \
    features/sprint-2-todo-list-management.md \
    features/sprint-3-todo-list-item-management.md \
    features/sprint-4-todo-user-profile-management.md \
    features/sprint-5-todo-due-date.md \
    features/reference/README.md \
    features/reference/data-model.md \
    features/reference/api.md \
  > /tmp/todo-speckit-specs.md

npx md-to-pdf /tmp/todo-speckit-specs.md
```

Note: the manual `cat` approach leaves YAML frontmatter in `.mdc` files; `npm run specs:pdf` strips it for cleaner PDF output.
