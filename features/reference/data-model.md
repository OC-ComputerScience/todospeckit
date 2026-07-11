# Data Model Reference

**Status:** Integrated schema through **Feature 5** (`todos.dueDate`).  
**Authority for new work:** feature specs in `features/` — update this file in the same PR when schema changes.  
**Architecture:** [ADR-0003 — MySQL relational database](../../docs/adr/0003-mysql-relational-database.md)

All application data is **scoped per user**. Cross-user resource access returns `404` at the API layer.

## Feature provenance

| Table / column | Introduced |
|----------------|------------|
| `users`, `sessions` | Feature 1 |
| `lists` | Feature 2 |
| `todos` (base) | Feature 3 |
| Profile fields on `users` (API only; no new columns) | Feature 4 |
| `todos.dueDate` | Feature 5 |

---

## `users`

| Column | Type | Rules |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; trimmed and stored lowercase (`beforeValidate` hook) |
| `password` | STRING(255) | Required; bcrypt hash only (never returned by API) |
| `role` | STRING(20) | Default `worker` |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

**Sequelize:** `defaultScope` excludes `password` from query results. Use `unscoped()` when comparing or hashing passwords.

**Features:** 1 (create/auth) · 4 (profile update via API)

---

## `sessions`

| Column | Type | Rules |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required; JWT string; cleared to `""` on logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24-hour lifetime from creation |
| `userId` | INTEGER FK | Required → `users.id` |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

**Feature:** 1

---

## `lists`

| Column | Type | Rules |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required; trimmed in API; max 100 characters |
| `userId` | INTEGER FK | Required → `users.id`; set from session on create (client `userId` ignored) |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

**Feature:** 2

---

## `todos`

| Column | Type | Rules |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `listId` | INTEGER FK | Required → `lists.id`; cascade on list delete |
| `title` | STRING(255) | Required; trimmed in API; max 255 characters |
| `completed` | BOOLEAN | Default `false` |
| `dueDate` | DATEONLY | Nullable; optional calendar date (`YYYY-MM-DD` in API) |
| `userId` | INTEGER FK | Required → `users.id`; set from session on create (client `userId` ignored) |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

**Features:** 3 (base) · 5 (`dueDate`)

---

## Associations

```
User 1──* List      (onDelete: CASCADE)
User 1──* Todo      (onDelete: CASCADE)
User 1──* Session   (onDelete: CASCADE)
List 1──* Todo      (onDelete: CASCADE)
```

| Association | Options |
|-------------|---------|
| `User hasMany Session` | `foreignKey: userId`, `as: sessions`, `onDelete: CASCADE` |
| `Session belongsTo User` | `foreignKey: userId`, `as: user` |
| `User hasMany List` | `foreignKey: userId`, `as: lists`, `onDelete: CASCADE` |
| `List belongsTo User` | `foreignKey: userId`, `as: user` |
| `User hasMany Todo` | `foreignKey: userId`, `as: todos`, `onDelete: CASCADE` |
| `Todo belongsTo User` | `foreignKey: userId`, `as: user` |
| `List hasMany Todo` | `foreignKey: listId`, `as: todos`, `onDelete: CASCADE` |
| `Todo belongsTo List` | `foreignKey: listId`, `as: list` |

---

## Cross-cutting rules

*   **Ownership:** `userId` on lists and todos always matches the authenticated user for reads/writes.
*   **Cascade:** Deleting a user cascades to sessions, lists, and todos. Deleting a list cascades to its todos.
*   **Ordering (API):** Lists alphabetical by `name` ASC; todos `completed` ASC (incomplete first), then `createdAt` ASC.
*   **Sync:** No checked-in migrations — schema defined in `backend/app/models/*.model.js` and synced at runtime.
