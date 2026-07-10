# C4 Level 3 — Backend components

Express app inside `backend/`: routes → controllers → models; cross-cutting auth and config.

**Layout:** `$c4BoundaryInRow="1"` stacks **Frontend SPA** → **Backend API** → **Database** (same vertical idea as the frontend diagram). Preview with a C4-capable Mermaid extension.

```mermaid
C4Component
title Todo Speckit — Backend API

UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")

Boundary(spaLayer, "Frontend SPA") {
    Container(spa, "Frontend SPA", "Vue 3, Vite, Vuetify, axios", "Browser client. Calls /todo/ with Bearer token.")
}

Container_Boundary(api, "Backend API") {
    Component(routes, "Routes", "Express routers", "Mounts /todo/*; wires HTTP to controllers.")
    Component(controllers, "Controllers", "Request handlers", "Validate input; call models; return flat JSON.")
    Component(authz, "Authorization", "authenticate + helpers", "Resolves req.user from Session; ownership helpers; 401 / 404.")
    Component(models, "Models", "Sequelize", "User, Session, List, Todo and associations.")
    Component(config, "Config & logger", "db, auth, Winston", "Env, Sequelize instance, request/error logging.")
}

Boundary(dataLayer, "Database") {
    ContainerDb(db, "MySQL", "MySQL", "Persistent store — users, sessions, lists, todos.")
}

Rel_D(spa, routes, "JSON", "Bearer")
Rel(routes, authz, "Uses on protected routes")
Rel(routes, controllers, "Delegates")
Rel(controllers, authz, "Uses ownership helpers")
Rel(controllers, models, "CRUD")
Rel_D(models, db, "SQL")
Rel(authz, models, "Loads Session / User")
Rel(config, models, "Provides Sequelize")

UpdateRelStyle(spa, routes, $offsetY="-30")
UpdateRelStyle(models, db, $offsetY="-30")
```

**Related:** [ADR-0002](../adr/0002-security-architecture.md) · [auth-patterns.mdc](../../.cursor/rules/auth-patterns.mdc) · [security.mdc](../../.cursor/rules/security.mdc)
