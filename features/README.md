# Feature Specifications

Spec-driven development (SDD) source of truth for the Todo Speckit project.  
No application code may be written unless it maps to a requirement in one of these files.

**Methodology:** [framework.md](./framework.md) — how to write, trace, and ship feature specs.

**Sprints** (timeboxes, iterations, team planning) live in your agile tool — they are **not** part of these specs. One sprint may contain multiple features; one feature may span sprints. Specs describe **what** to build; sprints describe **when** the team works on it.

## Feature catalog

| ID | File | Branch | Depends on |
|----|------|--------|------------|
| 1 | [feature-1-user-auth.md](./feature-1-user-auth.md) | `feature/1-user-auth` | — |
| 2 | [feature-2-todo-list-management.md](./feature-2-todo-list-management.md) | `feature/2-todo-list-management` | Feature 1 |
| 3 | [feature-3-todo-list-item-management.md](./feature-3-todo-list-item-management.md) | `feature/3-todo-list-item-management` | Features 1–2 |
| 4 | [feature-4-user-profile-management.md](./feature-4-user-profile-management.md) | `feature/4-user-profile-management` | Features 1–3 |
| 5 | [feature-5-todo-due-date.md](./feature-5-todo-due-date.md) | `feature/5-todo-due-date` | Features 1–3 |

**Branch roles:** `main` = scaffold-only starter kit · `dev` = integration (branch from `main`, merge features here) · `feature/N-*` = feature implementation (branch from `dev`).

Implement features in dependency order (1 → 2 → 3; 4 and 5 after 3). Features 4 and 5 do not depend on each other.

## Living reference (current integrated state)

After features merge to `dev`, keep these snapshots in sync with the codebase:

| File | Purpose |
|------|---------|
| [reference/README.md](./reference/README.md) | How to maintain reference docs |
| [reference/data-model.md](./reference/data-model.md) | Current database tables and associations |
| [reference/api.md](./reference/api.md) | Current REST API under `/todo/` |

Feature specs define **changes**; reference files describe **what exists now**.

## Implementation order (each feature)

1. Backend models and associations
2. Backend routes, controllers, authorization helpers
3. Backend tests (Jest + supertest)
4. Frontend services (`*Services.js`, axios client)
5. Frontend views and components
6. Frontend tests (Vitest + `@vue/test-utils`)
7. Router updates and manual verification

## Related project docs

- Cursor rules: `.cursor/rules/`
- Architecture decisions: `docs/adr/` — [index](../docs/adr/README.md)
- Living reference: `features/reference/` (data model + API snapshot on `dev`)
- Backend env: `backend/.env` (copy from `backend/.env.example`)
- Test env: `backend/.env.test` (copy from `backend/.env.test.example`)
- UI references (optional): `docs/ui/` — link Figma exports from each feature spec

## Running tests

```bash
npm test                 # from repo root — backend + frontend
npm run test:backend     # Jest
npm run test:frontend    # Vitest
```

## Export rules & specs to PDF

Combine Cursor rules, ADRs, and feature specs into one PDF:

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

- `docs/todo-speckit-specs.md` — combined Markdown (rules, ADRs, specs, reference)
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
9. `docs/adr/README.md`
10. `docs/adr/0001-client-server-multi-user-architecture.md`
11. `docs/adr/0002-security-architecture.md`
12. `docs/adr/0003-mysql-relational-database.md`
13. `features/README.md`
14. `features/framework.md`
15. `features/feature-1-user-auth.md` through `feature-5-todo-due-date.md`
16. `features/reference/README.md`, `data-model.md`, `api.md`

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
    docs/adr/README.md \
    docs/adr/0001-client-server-multi-user-architecture.md \
    docs/adr/0002-security-architecture.md \
    docs/adr/0003-mysql-relational-database.md \
    features/README.md \
    features/framework.md \
    features/feature-1-user-auth.md \
    features/feature-2-todo-list-management.md \
    features/feature-3-todo-list-item-management.md \
    features/feature-4-user-profile-management.md \
    features/feature-5-todo-due-date.md \
    features/reference/README.md \
    features/reference/data-model.md \
    features/reference/api.md \
  > /tmp/todo-speckit-specs.md

npx md-to-pdf /tmp/todo-speckit-specs.md
```

Note: the manual `cat` approach leaves YAML frontmatter in `.mdc` files; `npm run specs:pdf` strips it for cleaner PDF output.
