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

After features merge to `dev`, keep these snapshots in sync with the codebase (**required** when schema or API changed — see [Merge checklist + Agility sync](./framework.md#merge-checklist--agility-sync)):

| File | Purpose |
|------|---------|
| [reference/README.md](./reference/README.md) | How to maintain reference docs |
| [reference/data-model.md](./reference/data-model.md) | Current database tables and associations |
| [reference/api.md](./reference/api.md) | Current REST API under `/todo/` |

Feature specs define **changes**; reference files describe **what exists now**. Spec evolution after merge: prefer a new feature delta — [framework.md](./framework.md#spec-evolution-after-merge).

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
- Quality attributes (NFRs): `docs/nfr/` — [index](../docs/nfr/README.md)
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

If PDF generation fails with a missing Chrome error, either use installed Google Chrome / Edge (macOS, Windows, or Linux paths are detected) or run the one-time browser download:

```bash
npm run specs:pdf:setup
npm run specs:pdf
```

Output:

- `docs/todo-speckit-specs.md` — combined Markdown (rules, ADRs, specs, reference)
- `docs/todo-speckit-specs.pdf` — PDF export

**Included (auto-discovered each run):**

1. All `.cursor/rules/*.mdc` (preferred order, then any extras alphabetically)
2. `docs/adr/README.md` + every `docs/adr/NNNN-*.md` (numeric order)
3. `docs/nfr/README.md` + `docs/nfr/*.md` (quality attributes)
4. `features/README.md`, `features/framework.md`
5. Every `features/feature-N-*.md` (numeric order)
6. `features/reference/*.md`

Adding a new feature, ADR, or NFR markdown file is enough — no edits to `scripts/export-specs-pdf.mjs`.

Manual alternative (no npm script):

```bash
# Prefer npm run specs:pdf — it strips .mdc frontmatter and discovers new files.
npx md-to-pdf docs/todo-speckit-specs.md
```

Note: the manual `cat` approach leaves YAML frontmatter in `.mdc` files and will miss new features unless you extend the file list; `npm run specs:pdf` strips frontmatter and auto-discovers.
