# C4 Level 2 — Containers

Monorepo split: browser SPA talks to a stateless REST API; API owns auth and `userId` scoping; MySQL holds rows.

```mermaid
C4Container
title Todo Speckit — Containers

Person(user, "Registered User", "Uses the SPA in a browser.")

System_Boundary(todoSpeckit, "Todo Speckit") {
    Container(spa, "Frontend SPA", "Vue 3, Vite, Vuetify 4, axios", "SPA on port 8082 (dev). Router guards and localStorage user cache for UX only.")
    Container(api, "Backend API", "Node.js, Express, Sequelize", "REST under /todo/. JWT + Session table; authenticate middleware; ownership in every query.")
    ContainerDb(db, "Database", "MySQL", "users, sessions, lists, todos — rows scoped by userId.")
}

Rel(user, spa, "Uses", "HTTPS")
Rel(spa, api, "JSON API calls", "Bearer JWT, /todo/")
Rel(api, db, "Reads and writes", "Sequelize")
```

**Dev ports:** frontend `8082` · backend `3200` · CORS origin must match the SPA.

**Related:** [project-structure.mdc](../../.cursor/rules/project-structure.mdc) · [api.md](../../features/reference/api.md)
