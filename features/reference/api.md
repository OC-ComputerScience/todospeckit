# API Reference

**Base path:** `/todo/`  
**Status:** Integrated API through **Feature 5** (todo `dueDate`).  
**Authority for new work:** feature specs in `features/` — update this file in the same PR when routes or payloads change.

**Auth:** Send `Authorization: Bearer <token>` on protected routes.  
**Errors:** `{ "message": "Human-readable explanation." }` unless noted.  
**Cross-user access:** `404` (never `403`).

## Feature provenance

| Area | Feature |
|------|---------|
| Register, login, logout | 1 |
| Lists CRUD | 2 |
| Todos CRUD (nested under lists) | 3 |
| User profile GET/PUT | 4 |
| Todo `dueDate` on create/update | 5 |

---

## Authentication (Feature 1)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/todo/register` | No | Create account |
| `POST` | `/todo/login` | No | Sign in; returns session payload |
| `POST` | `/todo/logout` | Yes | Invalidate session token |

**Register body:**
```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jdoe@example.com",
  "username": "jdoe",
  "password": "password123"
}
```

**Login body:**
```json
{
  "username": "jdoe",
  "password": "password123"
}
```

**Register / login success** (`201` register · `200` login):
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

**Logout success** (`200`):
```json
{
  "message": "Signed out successfully."
}
```

**Common auth errors:** missing fields `400`; password < 8 chars `400`; duplicate username/email `400`; invalid login `401` with `"Invalid username or password."`; missing/invalid token on protected routes `401`.

---

## Lists (Feature 2)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists` | Yes | All lists for caller (array, ordered by `name` ASC) |
| `POST` | `/todo/lists` | Yes | Create list |
| `PUT` | `/todo/lists/:listId` | Yes | Rename list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete list (cascades todos) |

**Create / rename body:** `{ "name": "Groceries" }`

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

**Delete success** (`200`):
```json
{
  "message": "List deleted successfully."
}
```

**Common list errors:** empty or missing name `400`; name > 100 chars `400`; invalid `listId` `400`; unowned/missing list `404`. Client-supplied `userId` on create is ignored — ownership comes from the session.

---

## Todos (Feature 3; `dueDate` Feature 5)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists/:listId/todos` | Yes | Todos in owned list (ordered incomplete first, then `createdAt` ASC) |
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

`dueDate` is optional; omit for no due date. `null` or `""` on create means no due date.

**Update body** (partial):
```json
{
  "title": "Buy oat milk",
  "completed": true,
  "dueDate": "2026-07-20"
}
```

Clear due date: `{ "dueDate": null }` or `{ "dueDate": "" }`. Omit `dueDate` to leave unchanged.

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

**Delete success** (`200`):
```json
{
  "message": "Todo deleted successfully."
}
```

**Common todo errors:** empty title `400`; title > 255 chars `400`; invalid `dueDate` `400` (`"Due date must be a valid date in YYYY-MM-DD format."`); invalid ids `400`; unowned list/todo `404`. Client-supplied `userId` on create is ignored.

---

## User profile (Feature 4)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/users/:id` | Yes | Own profile only (`:id` must equal caller's `userId`) |
| `PUT` | `/todo/users/:id` | Yes | Update own profile |

**Update body** (all fields required except `password`):
```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "password": "newpassword123"
}
```

`password` optional — omit, `null`, or `""` to leave unchanged. When provided, must be ≥ 8 characters.

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

**Common profile errors:** missing required fields `400`; password < 8 chars `400`; duplicate username/email `400`; cross-user access `404`; invalid `id` `400`.

---

## Status codes (summary)

| Code | When |
|------|------|
| `200` / `201` | Success |
| `400` | Validation (missing fields, invalid ids, invalid `dueDate`, duplicate email/username, short password, empty list/todo title, etc.) |
| `401` | Missing token (`"Unauthorized! No token provided."`), invalid/expired token (`"Unauthorized! Invalid or expired token."`), or invalid login credentials |
| `404` | Resource not found or not owned by caller |
| `500` | Server error |
