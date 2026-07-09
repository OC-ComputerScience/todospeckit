# Feature Specifications

Spec-driven development (SDD) source of truth for **this** application.  
No application code may be written unless it maps to a requirement in one of these files.

**Methodology:** [framework.md](./framework.md) — how to write, trace, and ship feature specs.

**Sprints** live in your agile tool — they are **not** part of these specs.

## Feature catalog

| ID | File | Branch | Depends on |
|----|------|--------|------------|
| — | *Add `feature-1-….md` before implementation* | `feature/1-…` | — |

**Branch roles:** `main` = scaffold-only starter kit · `dev` = integration · `feature/N-*` = feature work (branch from `dev`).

## Living reference

Update on merge to `dev` when schema or API changed — required DoD ([Merge checklist + Agility sync](./framework.md#merge-checklist--agility-sync)). Spec evolution after merge: [prefer a new feature delta](./framework.md#spec-evolution-after-merge).

| File | Purpose |
|------|---------|
| [reference/README.md](./reference/README.md) | How to maintain reference docs |
| [reference/data-model.md](./reference/data-model.md) | Current database tables (update on merge to `dev`) |
| [reference/api.md](./reference/api.md) | Current REST API (update on merge to `dev`) |

## Related

- Cursor rules: `.cursor/rules/`
- ADRs: `docs/adr/`
- Starter kit notes: `docs/STARTER-KIT.md`
