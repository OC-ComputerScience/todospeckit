# Architecture Decision Records (ADRs)

Durable **why** decisions for cross-cutting concerns that outlive any single feature spec.

| Artifact | Question |
|----------|----------|
| [Constitution](../../.cursor/rules/constitution.mdc) | What are the non-negotiable laws? |
| [Cursor rules](../../.cursor/rules/) | How must we implement (patterns)? |
| **ADRs** (`docs/adr/`) | Why did we choose this approach? |
| [Feature specs](../../features/) | What must the product do? |
| [Reference](../../features/reference/) | What exists on `dev` now? |

ADRs do **not** replace feature specs or Cursor rules. They capture context, alternatives, and consequences when a choice affects multiple features or the whole stack.

---

## When to write an ADR

| Situation | Write an ADR? |
|-----------|---------------|
| New product behavior for one feature | No — use `features/feature-N-*.md` |
| Ongoing coding pattern for the team | No — use `.cursor/rules/*.mdc` |
| Significant stack or architecture choice | **Yes** |
| Security or data-isolation model | **Yes** |
| Deviation from an existing rule | **Yes** — then update the rule |

Write the ADR **before** or **with** the first feature that depends on the decision. Link it from affected feature specs (`**Related:**` in the header).

---

## File naming

```
docs/adr/
  README.md                 ← this file
  NNNN-short-kebab-title.md ← one decision per file
```

- **Number:** four digits, sequential (`0001`, `0002`, …). Never reuse a retired number.
- **Title:** short, specific, kebab-case.
- **Status:** `Proposed` | `Accepted` | `Deprecated` | `Superseded by ADR-NNNN`

---

## Template

Copy the block below into a new file and fill in each section.

```markdown
# ADR-NNNN: Short title

**Status:** Proposed | Accepted | Deprecated | Superseded by [ADR-XXXX](XXXX-title.md)
**Date:** YYYY-MM-DD
**Deciders:** team / role names

## Context

What problem or constraint forced a decision? What was unclear?

## Decision

What we chose, in one or two sentences. Be specific (technologies, boundaries, invariants).

## Consequences

### Positive
- …

### Negative / tradeoffs
- …

## Alternatives considered

| Option | Why not |
|--------|---------|
| … | … |

## Related artifacts

- Feature specs: …
- Cursor rules: …
- Supersedes / superseded by: …
```

---

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [0001](./0001-client-server-multi-user-architecture.md) | Client–server architecture for multi-user todo data | Accepted |
| [0002](./0002-security-architecture.md) | Layered security architecture | Accepted |
| [0003](./0003-mysql-relational-database.md) | MySQL relational database | Accepted |
