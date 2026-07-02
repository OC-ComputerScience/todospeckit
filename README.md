# Todo Speckit

A reference implementation for **Spec-Driven Development (SDD)** — a multi-user todo application built incrementally from written specifications, with AI-assisted coding guardrails via [Cursor](https://cursor.com) rules.

The application is intentionally simple (auth, todo lists, todo items). The pedagogical goal is the **process**: specifications define *what* to build; Cursor rules define *how* to build it; automated tests verify that both were followed.

---

## What is Spec-Driven Development?

In traditional workflows, code often leads and documentation follows. SDD inverts that relationship:

1. **Write the spec first** — user stories, API contracts, data models, and Gherkin acceptance criteria live in `features/` before application code exists.
2. **Implement against the spec** — every model, route, service, and view must trace back to an explicit requirement.
3. **Verify with tests** — each acceptance scenario maps to automated tests; code is not "done" until they pass.
4. **Govern with rules** — `.cursor/rules/` encodes stack conventions so humans and AI assistants produce consistent output.

This repository ships with **scaffolding only** (config, deploy scripts, test harness). Feature code is generated sprint-by-sprint from the spec files.

---

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3, Vuetify 4, Vite, vue-router, axios |
| Backend | Node.js (ES modules), Express 4, Sequelize 6, MySQL |
| Auth | bcryptjs, JWT, server-side Session table |
| Tests | Jest + supertest (backend), Vitest + `@vue/test-utils` (frontend) |
| Deploy | GitHub Actions → SSH (separate frontend static + backend Node jobs) |

The API is mounted at `/todo/`. All list and todo data is **scoped per user** — cross-user access returns `404`, not `403`.

```
┌─────────────────┐     HTTP /todo/      ┌─────────────────┐
│  frontend/      │ ◄──────────────────► │  backend/       │
│  Vue SPA :8082  │   Bearer token       │  Express :3200  │
└─────────────────┘                      └────────┬────────┘
                                                    │
                                           ┌────────▼────────┐
                                           │  MySQL          │
                                           │  todospeckit-db │
                                           └─────────────────┘
```

---

## Repository layout

```
todo-speckit/
├── features/              # SDD specifications (source of truth)
├── .cursor/rules/         # AI + team coding conventions
├── frontend/              # Vue SPA
├── backend/               # Express API
├── scripts/               # Local bundle scripts for deployment
├── .github/workflows/     # CI tests + deploy pipelines
└── package.json           # Root orchestration scripts
```

### Specifications (`features/`)

| Sprint | Spec | Delivers |
|--------|------|----------|
| 1 | [sprint-1-user-auth.md](features/sprint-1-user-auth.md) | Registration, login, logout, session, route guards |
| 2 | [sprint-2-todo-list-management.md](features/sprint-2-todo-list-management.md) | List CRUD, dashboard sidebar |
| 3 | [sprint-3-todo-list-item-management.md](features/sprint-3-todo-list-item-management.md) | Todo item CRUD, dashboard main panel |

See [features/README.md](features/README.md) for sprint dependencies and implementation order.

### Cursor rules (`.cursor/rules/`)

| Rule | Purpose |
|------|---------|
| [constitution.mdc](.cursor/rules/constitution.mdc) | SDD principles, branching, testing mandate |
| [project-structure.mdc](.cursor/rules/project-structure.mdc) | Directory layout, env vars, ports |
| [api-conventions.mdc](.cursor/rules/api-conventions.mdc) | REST routes, JSON responses, Sequelize patterns |
| [auth-patterns.mdc](.cursor/rules/auth-patterns.mdc) | Login, session, token flow |
| [security.mdc](.cursor/rules/security.mdc) | User-scoped data, password hashing |
| [frontend-services.mdc](.cursor/rules/frontend-services.mdc) | Axios client, router, services layer |
| [ui-style-system.mdc](.cursor/rules/ui-style-system.mdc) | Vuetify 4 component defaults |
| [testing-standards.mdc](.cursor/rules/testing-standards.mdc) | Jest/Vitest requirements |

---

## Getting started

### Prerequisites

- Node.js 24+
- MySQL (e.g. XAMPP)
- npm

### 1. Clone and install dependencies

```bash
git clone <repository-url> todo-speckit
cd todo-speckit

npm install --prefix frontend
npm install --prefix backend
```

Each app maintains its own `node_modules/` (`frontend/node_modules/`, `backend/node_modules/`). The root `package.json` orchestrates scripts only.

### 2. Create the database

```sql
CREATE DATABASE `todospeckit-db`;
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test
```

Edit `backend/.env` with your MySQL credentials. Default database name: `todospeckit-db`.

For local development you may set `SEQUELIZE_SYNC_ALTER=true` so Sequelize creates/updates tables on startup.

### 4. Run the application

```bash
# Terminal 1 — API
cd backend && npm run dev

# Terminal 2 — SPA
cd frontend && npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8082 |
| Backend API | http://localhost:3200/todo/ |

### 5. Run tests

```bash
npm test                  # from repo root — backend + frontend
npm run test:backend      # Jest only
npm run test:frontend     # Vitest only
```

---

## Development workflow

This project is designed for iterative, spec-first development with AI assistance.

### Branching

Never commit directly to `main`. Use feature branches per sprint:

```
feature/sprint-1-user-auth
feature/sprint-2-todo-list-management
feature/sprint-3-todo-list-item-management
```

### Per-sprint implementation order

1. Backend models and associations
2. Backend routes, controllers, authorization helpers
3. Backend tests
4. Frontend services (`*Services.js`, axios client)
5. Frontend views and components
6. Frontend tests
7. Router updates and manual verification

### Working with Cursor

When prompting the AI to implement a feature:

1. Reference the sprint spec: *"Implement features/sprint-1-user-auth.md"*
2. Work on the matching feature branch
3. Implement in micro-steps (model → API → service → view → test)
4. Ask the AI to map each change back to a Gherkin scenario

The constitution rule requires the AI to **refuse code generation** that has no corresponding spec in `features/`.

### Optional UI references

Export Figma frames to `docs/ui/sprint-N/` and link them from the sprint spec. Specs remain the functional source of truth; designs are visual guidance.

---

## Deployment

The monorepo deploys as **two independent artifacts** from one git repository:

| Artifact | Source | Workflow |
|----------|--------|----------|
| Static SPA | `frontend/dist/` | [.github/workflows/vue-deploy.yml](.github/workflows/vue-deploy.yml) |
| Node API | `backend/deploy/` | [.github/workflows/node-deploy.yml](.github/workflows/node-deploy.yml) |

Local bundle scripts:

```bash
./scripts/bundle-frontend.zsh   # → frontend/dist/
./scripts/bundle-backend.zsh    # → backend/deploy/  (requires backend/.env)
./scripts/bundle-all.zsh        # both
```

CI tests run on push/PR via [.github/workflows/test.yml](.github/workflows/test.yml).

Deploy workflows require GitHub secrets (`SERVER_SSH_KEY`, `REMOTE_HOST`, `DB_*`, etc.). See workflow files for the full list.

---

## API overview

All authenticated endpoints require `Authorization: Bearer <token>`.

| Sprint | Endpoints |
|--------|-----------|
| 1 | `POST /todo/register`, `/login`, `/logout` |
| 2 | `GET/POST/PUT/DELETE /todo/lists` |
| 3 | `GET/POST /todo/lists/:listId/todos`, `PUT/DELETE /todo/todos/:id` |

Responses use flat JSON (no `{ success, data }` envelope). Errors return `{ "message": "..." }`.

---

## Design principles

- **Specs over code** — if it is not in `features/`, it should not exist in the codebase.
- **One user, one tenant** — every query scopes to `req.user.id`; never trust client-supplied `userId`.
- **Rules over improvisation** — stack and patterns live in `.cursor/rules/`; deviations require a spec update.
- **Tests over assumptions** — every Gherkin scenario earns at least one automated test.
- **Incremental delivery** — three sprints, three branches, three reviewable units of work.

---

## License

Private / educational use. Adjust licensing as needed for your organization.
