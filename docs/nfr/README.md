# Non-Functional Requirements (quality attributes)

Living snapshot of **system characteristics** (“ilities”) for this product — performance, reliability, availability, security posture, accessibility, and related bars.

| Artifact | Question |
|----------|----------|
| [Feature specs](../../features/) | What must the product *do*? |
| **This folder** (`docs/nfr/`) | What quality bars apply *across* the product? |
| [ADRs](../adr/README.md) | *Why* did we choose a particular approach for a quality? |
| [Cursor rules](../../.cursor/rules/) | *How* must code meet ongoing constraints? |
| [Reference](../../features/reference/) | What API/schema exists on `dev` now? |

NFRs here do **not** authorize new product behavior by themselves. Feature specs still authorize *what* to build. Use this doc to record targets, deferrals, and links to ADRs/rules.

---

## Files

| File | Contents |
|------|----------|
| [quality-attributes.md](./quality-attributes.md) | Attribute table: target, approach, verification, status |

---

## When to update

| When | Action |
|------|--------|
| New app-wide quality bar (or explicit “out of scope”) | Update [quality-attributes.md](./quality-attributes.md) |
| Choose *how* to meet a bar (caching, HA, auth model, …) | Write or update an [ADR](../adr/README.md); link from the attribute row |
| Ongoing coding constraint for agents | Add/update a `.cursor/rules/*.mdc` entry; link from the row |
| Feature-local quality only | Prefer **System Requirements** + Gherkin in that feature; optionally link here |

---

## Related

- [ADR index](../adr/README.md)
- [SDD framework](../../features/framework.md)
- [Security rule](../../.cursor/rules/security.mdc)
