# Quality attributes

App-wide non-functional targets for Todo Speckit. Status values: **Accepted** (in force) · **Deferred** (documented, not enforced yet) · **Out of scope** (explicit non-goal for this teaching app).

| Column | Meaning |
|--------|---------|
| **Target** | Measure or bar for the attribute — prefer a **number** (latency, %, count, level). Figures below are **illustrative classroom examples**, not production SLOs unless Status is Accepted and tests enforce them. |
| **Approach** | How the target is realized or limited (stack choice, pattern, explicit non-goal) |

Update this table when the bar changes. Link ADRs for *why* an approach was chosen; link Cursor rules for *implementation* constraints. Feature-local bars stay in that feature’s **System Requirements** (+ Gherkin when testable).

| Attribute | Target | Approach | How we verify | Status | Links |
|-----------|--------|------------|---------------|--------|-------|
| **Security** | **100%** of protected routes require auth; **0** cross-user reads/writes in automated tests; other users’ resources → **404** (not 403) | Layered API enforcement; ownership isolation | Gherkin + Jest (supertest); Vitest for UX-only guards | Accepted | [ADR-0002](../adr/0002-security-architecture.md), [security.mdc](../../.cursor/rules/security.mdc), [auth-patterns.mdc](../../.cursor/rules/auth-patterns.mdc) |
| **Data integrity** | **100%** of list/todo rows have a valid owning `userId`; **0** orphan associations after CRUD tests | Relational MySQL; foreign keys / Sequelize associations | Jest + schema in [data-model](../../features/reference/data-model.md) | Accepted | [ADR-0003](../adr/0003-mysql-relational-database.md) |
| **Reliability** | Happy-path write success ≥ **99%** in local test runs; failed writes return HTTP **4xx/5xx** with a body (never empty **200**) | Single-process Express; no HA/retry layer | Jest on create/update/delete paths | Deferred | — |
| **Availability** | Local demo uptime goal **≥ 95%** of lab session time; **no** multi-region SLA | Single-node deploy (XAMPP or similar); no HA | N/A | Out of scope | [ADR-0001](../adr/0001-client-server-multi-user-architecture.md) |
| **Performance** | p95 API latency **&lt; 200 ms** (local XAMPP); dashboard first paint **&lt; 2 s** on a typical student laptop | No formal load-test gate in CI yet | Manual / `npm run dev` (future: timed Jest or k6) | Deferred | — |
| **Scalability** | Correct for **≤ 30** concurrent classroom users; **≤ 500** todos per user without pagination redesign | Multi-user correctness, not horizontal scale | Ownership tests; manual multi-browser check | Out of scope | [ADR-0001](../adr/0001-client-server-multi-user-architecture.md) |
| **Observability** | **100%** of unhandled server errors logged at `error`; HTTP access logged; retain rotating logs **≥ 7 days** | Winston console + daily rotate under `backend/logs/` | Logs present in local runs | Accepted (minimal) | `backend/app/config/logger.js` |
| **Usability** | New user completes register → create list → add todo in **≤ 3 minutes** without help; primary CTAs use labels from Screen Requirements (**100%** match); **≤ 2** clicks from dashboard to add a todo on an existing list | Vuetify + Screen Requirements; `oc-cta` for primary actions; empty states documented per feature | Manual walkthrough; Vitest for labeled CTAs / flows | Deferred | [ui-style-system.mdc](../../.cursor/rules/ui-style-system.mdc), feature **Screen Requirements** |
| **Accessibility (a11y)** | Primary flows keyboard-reachable; aim **WCAG 2.2 AA** for auth + dashboard when audited; **0** unlabeled icon-only CTAs on primary actions | Prefer Vuetify semantic components | Manual / future Vitest a11y | Deferred | [ui-style-system.mdc](../../.cursor/rules/ui-style-system.mdc) |
| **Internationalization (i18n)** | **1** locale (en-US); **0** translated string catalogs | No i18n framework | N/A | Out of scope | — |
| **Maintainability** | **100%** of Gherkin scenarios mapped in Test Coverage Map before merge; `npm test` green; feature PRs typically **≤ 15** files of product code (guideline) | Cursor rules + feature specs as source of truth | Merge checklist; `npm test` | Accepted | [framework.md](../../features/framework.md), constitution |

---

## Feature-local NFRs

If only one feature needs a bar (e.g. a specific validation or UI responsiveness note):

1. Put it under that feature’s **System Requirements**.
2. Add Gherkin when it must be proven by tests.
3. Optionally add a one-line pointer here (“see Feature N System Requirements”).

Do **not** invent a new feature file solely to “add performance.”

---

## Changing a bar

1. Edit this table (**Target** and/or **Approach**, status, links). Prefer a number in **Target**.
2. If the **Approach** changes → ADR.
3. If agents must follow a new coding constraint → Cursor rule.
4. If API/schema changed as a result → `features/reference/` on merge.
