# C4 Level 1 — System context

**Todo** (example application in OC CS Speckit): a registered user uses the web app; the app persists private lists and todos in MySQL via the API. No external SaaS dependencies in the teaching model.

Mermaid C4 layout is limited. Keep relationship labels **short**; avoid large `$offsetX` (it often drops text inside boxes). A small negative `$offsetY` lifts labels above the line.

```mermaid
C4Context
title Todo (example) — System Context

UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")

Person(user, "Registered User", "Owns private lists and todos.")
System(todoApp, "Todo", "Frontend SPA + Backend API. Server is source of truth. Example app for OC CS Speckit.")
SystemDb_Ext(mysql, "MySQL", "users, sessions, lists, todos.")

Rel_R(user, todoApp, "Uses")
Rel_R(todoApp, mysql, "Reads/writes")

UpdateRelStyle(user, todoApp, $offsetX="0", $offsetY="-40")
UpdateRelStyle(todoApp, mysql, $offsetX="0", $offsetY="-40")
```

**Related:** [ADR-0001](../adr/0001-client-server-multi-user-architecture.md) · [ADR-0003](../adr/0003-mysql-relational-database.md)
