# API Reference

**Base path:** `/todo/`  
**Status:** Integrated API through **Sprint 5** (todo `dueDate`).  
**Authority for new work:** sprint specs in `features/` — update this file when a sprint merges to `dev`.

**Auth:** Send `Authorization: Bearer <token>` on protected routes.  
**Errors:** `{ "message": "Human-readable explanation." }` unless noted.  
**Cross-user access:** `404` (never `403`).

---

## Authentication (Sprint 1)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/todo/register` | No | Create account |
| `POST` | `/todo/login` | No | Sign in; returns session payload |
| `POST` | `/todo/logout` | Yes | Invalidate session |

**Register / login success** (`200` / `201`):
```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

---

## Lists (Sprint 2)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists` | Yes | All lists for caller |
| `POST` | `/todo/lists` | Yes | Create list |
| `PUT` | `/todo/lists/:listId` | Yes | Rename list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete list (cascades todos) |

**Create body:** `{ "name": "Groceries" }`

**List object:**
```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

---

## Todos (Sprint 3; `dueDate` Sprint 5)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists/:listId/todos` | Yes | Todos in owned list |
| `POST` | `/todo/lists/:listId/todos` | Yes | Create todo |
| `PUT` | `/todo/todos/:id` | Yes | Update todo |
| `DELETE` | `/todo/todos/:id` | Yes | Delete todo |

**Create body:**
```json
{
  "title": "Buy milk",
  "dueDate": "2026-07-15"
}
```

`dueDate` is optional; omit or `null` for no due date.

**Update body** (partial):
```json
{
  "title": "Buy oat milk",
  "completed": true,
  "dueDate": "2026-07-20"
}
```

Clear due date: `{ "dueDate": null }`. Omit `dueDate` to leave unchanged.

**Todo object:**
```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "dueDate": "2026-07-15",
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

`dueDate` is `null` when not set.

**Common todo errors:** empty title `400`; invalid `dueDate` `400`; unowned list/todo `404`.

---

## User profile (Sprint 4)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/users/:id` | Yes | Own profile only (`:id` = caller) |
| `PUT` | `/todo/users/:id` | Yes | Update own profile |

**Update body:**
```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "password": "newpassword123"
}
```

`password` optional on update.

**Profile object** (no password hash):
```json
{
  "id": 42,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker",
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

**Cross-user profile access:** `404`

---

## Status codes (summary)

| Code | When |
|------|------|
| `200` / `201` | Success |
| `400` | Validation (missing fields, invalid `dueDate`, duplicate email/username, short password, etc.) |
| `401` | Missing, invalid, or expired token |
| `404` | Resource not found or not owned by caller |
| `500` | Server error |
