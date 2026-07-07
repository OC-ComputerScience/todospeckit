# Data Model Reference

**Status:** Integrated schema through **Feature 5** (includes `todos.dueDate`).  
**Authority for new work:** feature specs in `features/` — update this file when a feature merges to `dev`.  
**Architecture:** [ADR-0003 — MySQL relational database](../../docs/adr/0003-mysql-relational-database.md)

All application data is **scoped per user**. Cross-user resource access returns `404` at the API layer.

---

## `users`

| Column | Type | Rules |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; stored lowercase |
| `password` | STRING(255) | Required; bcrypt hash only (never returned by API) |
| `role` | STRING(20) | Default `worker` |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

**Feature:** 1 · **Profile edit:** Feature 4

---

## `sessions`

| Column | Type | Rules |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24-hour lifetime |
| `userId` | INTEGER FK | Required → `users.id` |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

**Feature:** 1

---

## `lists`

| Column | Type | Rules |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required; trimmed |
| `userId` | INTEGER FK | Required → `users.id`; set from session on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

**Feature:** 2

---

## `todos`

| Column | Type | Rules |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `listId` | INTEGER FK | Required → `lists.id`; cascade on list delete |
| `title` | STRING(255) | Required; trimmed; max 255 chars |
| `completed` | BOOLEAN | Default `false` |
| `dueDate` | DATEONLY | Nullable; optional; `YYYY-MM-DD` in API **(Feature 5)** |
| `userId` | INTEGER FK | Required → `users.id`; set from session on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

**Feature:** 3 (base) · **`dueDate`:** Feature 5

---

## Associations

```
User 1──* List
User 1──* Todo
User 1──* Session
List 1──* Todo   (onDelete: CASCADE)
```

| Association | Options |
|-------------|---------|
| `User hasMany List` | `foreignKey: userId`, `as: lists` |
| `List belongsTo User` | `foreignKey: userId` |
| `User hasMany Todo` | `foreignKey: userId`, `as: todos` |
| `Todo belongsTo User` | `foreignKey: userId` |
| `List hasMany Todo` | `foreignKey: listId`, `as: todos`, `onDelete: CASCADE` |
| `Todo belongsTo List` | `foreignKey: listId` |
| `User hasMany Session` | `foreignKey: userId` |
| `Session belongsTo User` | `foreignKey: userId` |

---

## Cross-cutting rules

*   **Ownership:** `userId` on lists and todos always matches the authenticated user for reads/writes.
*   **Cascade:** Deleting a list deletes its todos.
*   **Ordering (API):** Lists alphabetical by name; todos incomplete first, then `createdAt` ascending.
