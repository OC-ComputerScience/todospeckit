# Reference Specifications

**Living snapshot** of the integrated product on `dev` after merged features.

These files answer: *"What does the app look like right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

## Maintenance

| When | Action |
|------|--------|
| Feature merges to `dev` | **Required DoD:** update `data-model.md` and/or `api.md` in the same PR if tables, columns, routes, or payloads changed (see [Merge checklist + Agility sync](../framework.md#merge-checklist--agility-sync)) |
| New feature in progress | Feature spec owns the **delta**; reference updates at **merge** |
| Drift suspected | Compare reference to code and feature specs; fix reference or code |

## Files

| File | Contents |
|------|----------|
| [data-model.md](./data-model.md) | Current database tables, columns, associations |
| [api.md](./api.md) | Current REST API |

## Feature provenance

| Area | Introduced |
|------|------------|
| *(none yet)* | Add rows as features merge to `dev` |
