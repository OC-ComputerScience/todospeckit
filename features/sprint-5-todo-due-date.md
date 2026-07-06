# Feature: Todo Due Date

**Sprint:** 5  
**Branch pattern:** `feature/sprint-5-todo-due-date`  
**Depends on:** Sprints 1–3 (`features/sprint-1-user-auth.md`, `features/sprint-2-todo-list-management.md`, `features/sprint-3-todo-list-item-management.md`)  
**Related:** `features/reference/data-model.md`, `features/reference/api.md` (update on merge to `dev`)

---

## User Stories

### US-1: Set a due date when creating a todo
**As a** signed-in user  
**I want to** optionally set a due date when I add a todo  
**So that** I can plan when work should be finished

### US-2: View due dates on todos
**As a** signed-in user  
**I want to** see each todo's due date in the list  
**So that** I know what is due and when

### US-3: Edit or clear a due date
**As a** signed-in user  
**I want to** change or remove a due date when editing a todo  
**So that** I can keep deadlines accurate

### US-4: Spot overdue todos
**As a** signed-in user  
**I want** incomplete todos past their due date to stand out visually  
**So that** I can prioritize overdue work

---

## System Requirements

*   All behavior builds on Sprint 3 todo CRUD; list sidebar and ownership rules are unchanged.
*   `dueDate` is **optional** on create and update; `null` means no due date.
*   Store dates as **calendar dates only** (no time-of-day): API uses `YYYY-MM-DD`; database uses `DATEONLY`.
*   Reject invalid date strings with `400` and `{ "message": "..." }`.
*   Sending `dueDate: null` on `PUT` clears the due date.
*   Omitting `dueDate` on `PUT` leaves the existing value unchanged.
*   Todo sort order is unchanged from Sprint 3 (incomplete first, then `createdAt` ascending).
*   **Overdue:** an incomplete todo is overdue when `dueDate` is before today's date in the **browser's local calendar** (frontend display only; API returns the stored date).
*   On merge to `dev`, update `features/reference/data-model.md` and `features/reference/api.md` to include `dueDate`.

---

## Data Ownership & Isolation

Due date changes follow the same scope rules as Sprint 3 todos.

| Rule | Requirement |
|------|-------------|
| **Read scope** | `dueDate` is returned only on todos the caller already owns via list/todo scoping. |
| **Write scope** | `dueDate` may be set or cleared only on todos owned by `req.user.id`. |
| **Cross-user access** | Unchanged — `404` for another user's list or todo. |

---

## API Requirements

Extends Sprint 3 todo endpoints. Auth and ownership behavior are unchanged.

| Method | Endpoint | Change |
|--------|----------|--------|
| `POST` | `/todo/lists/:listId/todos` | Accept optional `dueDate` in body |
| `PUT` | `/todo/todos/:id` | Accept optional `dueDate` (date string or `null`) |
| `GET` | `/todo/lists/:listId/todos` | Response includes `dueDate` on each todo |

**Create todo request body:**
```json
{
  "title": "Buy milk",
  "dueDate": "2026-07-15"
}
```

`dueDate` is optional. Omit it or send `null` for no due date.

**Update todo request body** (any combination):
```json
{
  "title": "Buy oat milk",
  "completed": false,
  "dueDate": "2026-07-20"
}
```

Clear due date:
```json
{ "dueDate": null }
```

**Todo success response** (`200` / `201`):
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

**Validation errors:** `400` with `{ "message": "..." }` for invalid `dueDate` format.

**Error response:** unchanged from Sprint 3.  
**Not found / not owned:** `404` (do not use `403`).

---

## Screen Requirements

### [View: Application Dashboard] — route name `home`
Extends Sprint 3 main panel only.

**Add todo**
*   Optional `<v-text-field type="date">` (or equivalent) beside the title field for due date.
*   Leaving the date empty creates a todo with no due date.

**Todo row**
*   Show due date when set (formatted for readability, e.g. `Jul 15, 2026` or locale-appropriate).
*   When `completed` is `false` and `dueDate` is before today (local date), apply overdue styling (e.g. error color on the date text).
*   Completed todos do not use overdue styling even if the date is in the past.

**Edit todo dialog**
*   Add optional date field pre-filled with the current `dueDate` (empty when `null`).
*   User can clear the date and **Save** to remove the due date.
*   **Save** / **Cancel** behavior unchanged otherwise.

**Validation**
*   Client-side: reject invalid date input before API call where the control allows it.
*   API errors shown via existing `<v-alert type="error">`.

---

## Data Model Requirements

### `todos` table (add column)

| Field | Type | Rules |
|-------|------|-------|
| `dueDate` | DATEONLY | Nullable; optional on create/update |

Existing Sprint 3 columns are unchanged. Existing rows default to `dueDate: null`.

---

## Acceptance Criteria (Gherkin)

### Due date on create

#### Scenario: User adds a todo with a due date
*   **Given** I am signed in on the dashboard
*   **And** I have selected a list
*   **When** I enter todo title `Buy milk`
*   **And** I set due date `2026-07-15`
*   **And** I click **Add**
*   **Then** the API returns `201` with `dueDate` `2026-07-15`
*   **And** the todo row shows the due date

#### Scenario: User adds a todo without a due date
*   **Given** I am signed in
*   **And** I have selected a list
*   **When** I enter a title and leave the due date empty
*   **And** I click **Add**
*   **Then** the API returns `201` with `dueDate` null
*   **And** no due date is shown on the row

### Due date on update

#### Scenario: User sets a due date when editing a todo
*   **Given** I am signed in
*   **And** I have todo `Buy milk` with no due date
*   **When** I open the edit dialog
*   **And** I set due date `2026-07-20`
*   **And** I click **Save**
*   **Then** the API returns `200` with `dueDate` `2026-07-20`
*   **And** the row shows the new due date

#### Scenario: User clears a due date when editing a todo
*   **Given** I am signed in
*   **And** I have todo `Buy milk` with due date `2026-07-20`
*   **When** I open the edit dialog
*   **And** I clear the due date field
*   **And** I click **Save**
*   **Then** the API returns `200` with `dueDate` null
*   **And** the row no longer shows a due date

### Overdue display

#### Scenario: Incomplete todo past due date is styled as overdue
*   **Given** I am signed in
*   **And** I have an incomplete todo with `dueDate` yesterday
*   **When** I view the todo list
*   **Then** the due date is displayed with overdue styling

#### Scenario: Completed todo past due date is not styled as overdue
*   **Given** I am signed in
*   **And** I have a completed todo with `dueDate` yesterday
*   **When** I view the todo list
*   **Then** the due date does not use overdue styling

### API validation

#### Scenario: API rejects an invalid due date on create
*   **Given** I am signed in as user A
*   **And** I own a list
*   **When** I send `POST /todo/lists/:listId/todos` with body `{ "title": "Task", "dueDate": "not-a-date" }`
*   **Then** the API returns `400` with `{ "message": "..." }`
*   **And** no todo is created

#### Scenario: API rejects an invalid due date on update
*   **Given** I am signed in as user A
*   **And** I own todo `Buy milk`
*   **When** I send `PUT /todo/todos/:id` with body `{ "dueDate": "2026-99-99" }`
*   **Then** the API returns `400` with `{ "message": "..." }`
*   **And** the stored `dueDate` is unchanged

#### Scenario: User cannot set due date on another user's todo
*   **Given** I am signed in as user A
*   **And** a todo exists that belongs to user B
*   **When** I send `PUT /todo/todos/:id` with body `{ "dueDate": "2026-07-15" }`
*   **Then** the API returns `404` with `{ "message": "Todo with id=<id> not found." }`
*   **And** user B's todo is unchanged

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Area | Tool | Scenarios |
|------|------|-----------|
| `POST /todo/lists/:listId/todos` | Jest + supertest (`todos.test.js`) | Create with `dueDate`; create without `dueDate`; invalid `dueDate` `400`; ownership unchanged from Sprint 3 |
| `PUT /todo/todos/:id` | Jest + supertest (`todos.test.js`) | Set `dueDate`; clear `dueDate` with `null`; invalid `dueDate` `400`; `404` for another user's todo |
| `GET /todo/lists/:listId/todos` | Jest + supertest (`todos.test.js`) | Response includes `dueDate` (set and `null`) |
| `Dashboard.vue` (main panel) | Vitest (`Dashboard.test.js`) | Add todo with due date; edit set/clear due date; overdue styling for incomplete past-due todo; no overdue styling when completed |

---

## Definition of Done (Sprint 5)

*   [ ] Backend model migration / sync includes nullable `dueDate`
*   [ ] API and frontend implemented per this spec
*   [ ] All mapped tests pass (`npm test`)
*   [ ] `features/reference/data-model.md` updated
*   [ ] `features/reference/api.md` updated

---

## Out of Scope (Sprint 5)

*   Sorting or filtering todos by due date
*   Due date on quick-add without opening edit dialog (optional field on add row is in scope; separate due-date-only modal is not)
*   Reminders, notifications, or email alerts
*   Recurring todos
*   Time-of-day or timezone handling (date-only)
*   Calendar or agenda views
*   Changes to lists, profile, or auth (Sprints 2, 4)
