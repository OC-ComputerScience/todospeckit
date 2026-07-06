# Feature: Todo List Item Management

**Sprint:** 3  
**Branch pattern:** `feature/sprint-3-todo-list-item-management`  
**Depends on:** Sprint 1 (`features/sprint-1-user-auth.md`), Sprint 2 (`features/sprint-2-todo-list-management.md`)

---

## User Stories

### US-1: Add tasks to a list
**As a** signed-in user  
**I want to** add todo items to the currently selected list  
**So that** I can track what needs to be done in that context

### US-2: View tasks in a list
**As a** signed-in user  
**I want to** see all items in the selected list  
**So that** I know what work belongs to that group

### US-3: Complete tasks
**As a** signed-in user  
**I want to** mark todos as complete or incomplete  
**So that** I can track my progress

### US-4: Edit and remove tasks
**As a** signed-in user  
**I want to** edit or delete individual todos  
**So that** I can keep my lists accurate

### US-5: Private items only
**As a** signed-in user  
**I want** my todo items visible only to me  
**So that** other users cannot read or modify my tasks

### US-6: Lists carry their items
**As a** signed-in user  
**I want** deleting a list to remove its todo items  
**So that** I do not leave orphaned tasks in the database

---

## System Requirements

*   All todo endpoints require a valid session (`authenticate` middleware).
*   A **todo** belongs to exactly one list and one user for its entire lifetime.
*   Every database read, update, and delete must scope todos with `userId: req.user.id`.
*   Before creating a todo, verify the parent list is owned by `req.user.id`; otherwise return `404`.
*   On create, set `userId` and `listId` from validated server context — **ignore or strip** any `userId` or `listId` spoofing in the request body that would cross ownership boundaries.
*   Todo titles are trimmed before save; empty strings are rejected.
*   New todos default to `completed: false`.
*   Deleting a list deletes all todos in that list (cascade).
*   Todos are ordered with incomplete first, then by creation date ascending.
*   This sprint extends the Sprint 2 dashboard main panel — sidebar list behavior is unchanged.

---

## Data Ownership & Isolation

Each user owns their todo items exclusively. Items are private to the user even when nested under a list.

| Rule | Requirement |
|------|-------------|
| **Parent list check** | Todo operations require the parent list to belong to `req.user.id`. |
| **Todo scope** | `GET`, `PUT`, and `DELETE` on todos match both `id` and `userId = req.user.id`. |
| **Create scope** | `POST .../todos` succeeds only when `:listId` is owned by the caller; new todo `userId` is set from `req.user.id`. |
| **Cross-user access** | If a todo or parent list belongs to another user, respond with `404` — never `403`. |
| **UI scope** | The main panel shows only todos for the selected list that belong to the signed-in user (via API). |
| **Implementation** | Use shared helpers (e.g. `getAccessibleListOrNull`, `getAccessibleTodoOrNull`) in `app/authorization/`. |

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/todo/lists/:listId/todos` | Yes | Fetch all todos in a list |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo to a list |
| `PUT` | `/todo/todos/:id` | Yes | Update a todo (title and/or `completed`) |
| `DELETE` | `/todo/todos/:id` | Yes | Delete a todo owned by the caller |

All endpoints enforce **list ownership** and **todo ownership** by the authenticated user. Cross-user access attempts return `404`.

**Create todo request body:**
```json
{ "title": "Buy milk" }
```

**Todo success response** (`200` / `201`):
```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.  
**Not found / not owned:** `404` (do not use `403`).

---

## Screen Requirements

### [View: Application Dashboard] — route name `home`
Extends the Sprint 2 dashboard. Sidebar behavior is unchanged; **main panel** is fully implemented in this sprint.

**Main panel**
*   Heading shows the selected list name, or **"Select a list"** when none is selected.
*   Text field + **Add** button to create a new todo in the selected list (disabled when no list is selected).
*   Todo rows: checkbox (`completed`), title text, **edit** icon, **delete** icon.
*   **Edit:** clicking the edit icon opens a `<v-dialog>` with a `<v-text-field>` pre-filled with the current title; **Save** / **Cancel**.
*   **Delete:** clicking delete opens a confirmation `<v-dialog>`.
*   Completed todos show struck-through or muted title styling.
*   **Empty state:** **"No todos in this list yet."** when the selected list has zero todos.
*   **Loading state:** skeleton or progress indicator while todos are fetching.
*   **Error state:** `<v-alert type="error">` for API failures.

**List switch behavior**
*   Selecting a different list in the sidebar loads that list's todos in the main panel.

---

## Data Model Requirements

### `todos` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `listId` | INTEGER FK | Required; references `lists.id`; cascade on list delete |
| `title` | STRING | Required; max 255 chars |
| `completed` | BOOLEAN | Default `false` |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

### Associations (add to `models/index.js`)
*   `List hasMany Todo` — `onDelete: CASCADE`
*   `Todo belongsTo List`
*   `User hasMany Todo`
*   `Todo belongsTo User`

---

## Acceptance Criteria (Gherkin)

### Todo items

#### Scenario: User adds a todo to the selected list
*   **Given** I am signed in on the dashboard
*   **And** I have selected list `Groceries`
*   **When** I enter todo title `Buy milk`
*   **And** I click **Add**
*   **Then** the API returns `201` with a todo object where `completed` is `false`
*   **And** the returned `userId` matches my authenticated user ID
*   **And** the returned `listId` matches `Groceries`
*   **And** `Buy milk` appears in the main panel

#### Scenario: User adds a todo with an empty title
*   **Given** I am signed in
*   **And** I have a list selected
*   **When** I leave the todo title empty
*   **And** I click **Add**
*   **Then** inline validation blocks the request
*   **And** I see the message **"Todo title is required."**
*   **And** no API request is sent

#### Scenario: User adds a todo when no list is selected
*   **Given** I am signed in
*   **And** I have no list selected
*   **When** I view the main panel
*   **Then** the add-todo input and **Add** button are disabled

#### Scenario: Selected list has no todos
*   **Given** I am signed in
*   **And** I have selected an empty list
*   **When** the todos finish loading
*   **Then** I see **"No todos in this list yet."**

#### Scenario: User marks a todo as complete
*   **Given** I am signed in
*   **And** I have todo `Buy milk` with `completed: false`
*   **When** I check the todo's checkbox
*   **Then** the API returns `200` with `completed: true`
*   **And** the todo displays as completed (struck-through or muted)

#### Scenario: User marks a completed todo as incomplete
*   **Given** I am signed in
*   **And** I have todo `Buy milk` with `completed: true`
*   **When** I uncheck the todo's checkbox
*   **Then** the API returns `200` with `completed: false`
*   **And** the todo displays as active again

#### Scenario: User edits a todo title
*   **Given** I am signed in
*   **And** I have todo `Buy milk`
*   **When** I edit the title to `Buy oat milk`
*   **Then** the API returns `200` with the updated title
*   **And** the UI shows `Buy oat milk`

#### Scenario: User deletes a todo
*   **Given** I am signed in
*   **And** I have todo `Buy milk`
*   **When** I delete the todo
*   **Then** the API returns `200` or `204`
*   **And** the todo is removed from the main panel

#### Scenario: User switches lists
*   **Given** I am signed in
*   **And** list `Work` has todos `Email client` and `Write report`
*   **And** list `Personal` has todo `Call mom`
*   **When** I select `Personal` in the sidebar
*   **Then** the main panel shows only `Call mom`
*   **When** I select `Work` in the sidebar
*   **Then** the main panel shows `Email client` and `Write report`

#### Scenario: User cannot read todos in another user's list
*   **Given** I am signed in as user A
*   **And** user B owns list `Secret` with todo `Hidden task`
*   **When** I request `GET /todo/lists/:listId/todos` with user B's list ID
*   **Then** the API returns `404` with `{ "message": "List with id=<id> not found." }`
*   **And** `Hidden task` is not returned to user A

#### Scenario: User attempts to add a todo to another user's list
*   **Given** I am signed in as user A
*   **And** a list exists that belongs to user B
*   **When** I send `POST /todo/lists/:listId/todos` with user B's list ID and body `{ "title": "Intruder task" }`
*   **Then** the API returns `404` with `{ "message": "List with id=<id> not found." }`
*   **And** no todo is created in user B's list

#### Scenario: User attempts to rename another user's todo
*   **Given** I am signed in as user A
*   **And** a todo exists that belongs to user B
*   **When** I send `PUT /todo/todos/:id` with body `{ "title": "Hijacked" }`
*   **Then** the API returns `404` with `{ "message": "Todo with id=<id> not found." }`
*   **And** user B's todo title is unchanged in the database

#### Scenario: User attempts to delete another user's todo
*   **Given** I am signed in as user A
*   **And** a todo exists that belongs to user B
*   **When** I send `DELETE /todo/todos/:id`
*   **Then** the API returns `404` with `{ "message": "Todo with id=<id> not found." }`
*   **And** user B's todo still exists

#### Scenario: Client cannot assign a todo to another user on create
*   **Given** I am signed in as user A
*   **And** I own list `Groceries`
*   **When** I send `POST /todo/lists/:listId/todos` with body `{ "title": "Buy milk", "userId": 999 }` where user `999` is a different user
*   **Then** the API returns `201` with a todo owned by user A
*   **And** the saved `userId` is user A's ID, not `999`

#### Scenario: User only sees their own todos when switching lists
*   **Given** I am signed in as user A
*   **And** I own list `Work` with todo `My task`
*   **And** user B owns list `Work` with todo `Their task` (same list name, different owner)
*   **When** I select my `Work` list
*   **Then** I see only `My task`
*   **And** I do not see `Their task`

#### Scenario: Deleting a list removes its todos
*   **Given** I am signed in
*   **And** I own list `Groceries` with todos `Buy milk` and `Buy eggs`
*   **When** I delete list `Groceries` and confirm
*   **Then** both todos are removed from the database
*   **And** they no longer appear if the list ID were still queried

---

### Authentication (integration with Sprint 1)

#### Scenario: Unauthenticated API request for todos
*   **Given** I have no valid session token
*   **When** I request `GET /todo/lists/1/todos`
*   **Then** the API returns `401` with an unauthorized message

---

## Test Coverage Map

| Area | Tool | Scenarios |
|------|------|-----------|
| `GET /todo/lists/:listId/todos` | Jest + supertest | Returns only caller's todos for owned list; `404` for another user's list; `401` without token |
| `POST /todo/lists/:listId/todos` | Jest + supertest | Happy path, empty title, `404` for another user's list; ignores spoofed `userId` |
| `PUT /todo/todos/:id` | Jest + supertest | Update title, toggle `completed`; `404` for another user's todo; no mutation of other user's row |
| `DELETE /todo/todos/:id` | Jest + supertest | Delete owned todo; `404` for another user's todo; other user's row preserved |
| List delete cascade | Jest + supertest | Deleting list removes child todos |
| `Dashboard.vue` (main panel) | Vitest | Empty todo state, list switch loads correct todos |
| Todo input | Vitest | Empty title validation, disabled when no list selected |
| Todo row | Vitest | Checkbox toggles `completed`; edit and delete actions |

---

## Out of Scope (Sprint 3)

*   New list CRUD features (owned by Sprint 2)
*   Drag-and-drop reordering of todos
*   Due dates → [sprint-5-todo-due-date.md](./sprint-5-todo-due-date.md) (Sprint 5)
*   Priorities, labels, or notes on todos
*   Sharing lists or todos with other users
*   Search or filter across todos
*   Bulk complete / bulk delete
*   Archive completed todos
