# Quality attributes

App-wide non-functional targets for **this** product. Status values: **Accepted** · **Deferred** · **Out of scope**.

| Column | Meaning |
|--------|---------|
| **Target** | Measure or bar — prefer a **number** (latency, %, count, level). Use illustrative figures until you measure for real. |
| **Approach** | How the target is realized or limited |

Update when the bar changes. Link ADRs for *why* an approach was chosen; Cursor rules for *implementation* constraints. Feature-local bars stay in that feature’s **System Requirements**.

| Attribute | Target | Approach | How we verify | Status | Links |
|-----------|--------|------------|---------------|--------|-------|
| **Security** | e.g. **100%** protected routes require auth; **0** cross-user leaks in tests | *(define approach)* | | Deferred | |
| **Reliability** | e.g. happy-path write success ≥ **99%** in tests | | | Deferred | |
| **Availability** | e.g. demo uptime ≥ **95%** of lab session | | | Deferred | |
| **Performance** | e.g. p95 API **&lt; 200 ms** local; first paint **&lt; 2 s** | | | Deferred | |
| **Observability** | e.g. **100%** unhandled errors logged; retain logs **≥ 7 days** | | | Deferred | |
| **Usability** | e.g. core happy path in **≤ 3 minutes**; **≤ 2** clicks to add a todo on an existing list | | | Deferred | |
| **Accessibility (a11y)** | e.g. aim **WCAG 2.2 AA** for primary flows | | | Deferred | |
| **Internationalization (i18n)** | e.g. **1** locale | | | Out of scope | |
| **Maintainability** | **100%** Gherkin scenarios mapped before merge; `npm test` green | Cursor rules + feature specs as source of truth | Merge checklist; `npm test` | Accepted | [framework.md](../../features/framework.md) |

---

## Changing a bar

1. Edit this table (**Target** and/or **Approach**). Prefer a number in **Target**.
2. **Approach** change → [ADR](../adr/README.md).
3. Agent coding constraint → `.cursor/rules/`.
4. API/schema change → `features/reference/` on merge.
