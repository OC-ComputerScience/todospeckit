# Architecture diagrams (C4)

C4 views for **Todo Speckit**, as Mermaid. Source of truth for *why* the shape exists: [ADR-0001](../adr/0001-client-server-multi-user-architecture.md).

| File | C4 level | Shows |
|------|----------|--------|
| [c4-context.md](./c4-context.md) | Context | People and systems |
| [c4-container.md](./c4-container.md) | Container | SPA, API, MySQL |
| [c4-component-backend.md](./c4-component-backend.md) | Component | Backend API layers |
| [c4-component-frontend.md](./c4-component-frontend.md) | Component | Frontend SPA layers |
| [c4-deployment.md](./c4-deployment.md) | Deployment | User PC (browser) + Web Server (Apache, Node, MySQL) |

## Preview in Cursor

1. Wrap must be a ` ```mermaid ` fence with `C4Context` / `C4Container` / `C4Component` / `C4Deployment` on the first line.
2. Use **Markdown Preview Mermaid Support** (or another C4-capable Mermaid preview) — Cursor’s default preview often does not render C4.
3. Command Palette → open that extension’s preview (not only the built-in one if they conflict).

## PDF

`npm run specs:pdf` does **not** render Mermaid yet. For the PDF, export SVG/PNG and embed with `![…](./….svg)`, or extend the PDF script later.

These files are under `docs/arch_diagrams/` and are **not** auto-included in the specs PDF until you add discovery or link them from an ADR/feature doc.
