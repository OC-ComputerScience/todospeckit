# C4 Level 1 — System context

Todo Speckit: a registered user uses the web app; the app persists private lists and todos in MySQL via the API. No external SaaS dependencies in the teaching model.

Mermaid C4 layout is limited. Keep relationship labels **short**; avoid large `$offsetX` (it often drops text inside boxes). A small negative `$offsetY` lifts labels above the line.

```mermaid
C4Context
title Todo Speckit — System Context

UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")

Person(user, "Registered User", "Owns private lists and todos.")
System(todoSpeckit, "Todo Speckit", "Frontend SPA + Backend API. Server is source of truth.")
SystemDb_Ext(mysql, "MySQL", "users, sessions, lists, todos.")

Rel_R(user, todoSpeckit, "Uses")
Rel_R(todoSpeckit, mysql, "Reads/writes")

UpdateRelStyle(user, todoSpeckit, $offsetX="0", $offsetY="-40")
UpdateRelStyle(todoSpeckit, mysql, $offsetX="0", $offsetY="-40")
```

**Related:** [ADR-0001](../adr/0001-client-server-multi-user-architecture.md) · [ADR-0003](../adr/0003-mysql-relational-database.md)
