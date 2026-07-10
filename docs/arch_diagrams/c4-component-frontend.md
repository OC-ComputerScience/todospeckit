# C4 Level 3 — Frontend components

Vue SPA inside `frontend/src/`: views and components call axios services; router and localStorage support UX only (API remains authoritative).

**Layout:** `$c4BoundaryInRow="2"` places **Client UI** and **Shared** side by side; **Backend API** alone on the next row (underneath). Mermaid cannot set a different boundary count per row, so this is the workable pattern. Preview with a C4-capable Mermaid extension.

```mermaid
C4Component
title Todo Speckit — Frontend SPA

UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")

Boundary(clientUi, "Frontend SPA — Client UI") {
    Component(views, "Views", "Vue SFCs", "Route pages: login, register, dashboard, profile.")
    Component(components, "Components", "Vue SFCs", "Reusable UI: forms, nav, dialogs.")
    Component(router, "Router", "Vue Router", "Routes and guards (UX only).")
    Component(services, "Services", "axios *Services.js", "HTTP to /todo/; Bearer token.")
}

Boundary(shared, "Shared") {
    Component(config, "Config & plugins", "utils, Vuetify", "localStorage user helper; theme.")
}

Boundary(apiLayer, "Backend API") {
    Container(api, "Backend API", "Node.js, Express, Sequelize", "Server source of truth. REST under /todo/.")
}

Rel(views, components, "Composes")
Rel(views, router, "Navigates")
Rel(views, services, "Calls")
Rel(components, services, "Calls")
Rel(router, config, "User cache")
Rel(services, config, "Token")
Rel_D(services, api, "JSON", "Bearer")

UpdateRelStyle(views, components, $offsetY="-20")
UpdateRelStyle(views, router, $offsetY="-20")
UpdateRelStyle(views, services, $offsetY="-20")
UpdateRelStyle(services, api, $offsetY="-30")
```

**Related:** [frontend-services.mdc](../../.cursor/rules/frontend-services.mdc) · [ui-style-system.mdc](../../.cursor/rules/ui-style-system.mdc)
