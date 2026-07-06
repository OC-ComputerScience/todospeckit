# Reference Specifications

**Living snapshot** of the integrated product on `dev` after all merged sprints.

These files answer: *"What does the app look like right now?"*  
They do **not** authorize new scope by themselves — implement changes only from sprint specs in `features/sprint-*.md`.

## Maintenance

| When | Action |
|------|--------|
| Sprint merges to `dev` | Update `data-model.md` and `api.md` if tables or endpoints changed |
| New sprint in progress | Sprint spec owns the **delta**; reference updates at **merge** |
| Drift suspected | Compare reference to code and sprint specs; fix reference or code |

## Files

| File | Contents |
|------|----------|
| [data-model.md](./data-model.md) | Current database tables, columns, associations |
| [api.md](./api.md) | Current REST API under `/todo/` |

## Sprint provenance

| Area | Introduced |
|------|------------|
| Users, sessions, auth | Sprint 1 |
| Lists | Sprint 2 |
| Todos | Sprint 3 |
| User profile | Sprint 4 |
| Todo `dueDate` | Sprint 5 |
