# Feature: Todo List Management

**Sprint:** 2  
**Branch pattern:** `feature/sprint-2-todo-list-management`  
**Depends on:** Sprint 1 (`features/sprint-1-user-auth.md`)

---

## User Stories

### US-1: Create todo lists
**As a** signed-in user  
**I want to** create named todo lists (e.g. "Work", "Groceries")  
**So that** I can organize tasks into separate groups

### US-2: View my lists
**As a** signed-in user  
**I want to** see all of my todo lists in a sidebar  
**So that** I can see what groups I have created

### US-3: Select a list
**As a** signed-in user  
**I want to** select a list from the sidebar  
**So that** I can focus on one group at a time (todo items added in Sprint 3)

### US-4: Rename and delete lists
**As a** signed-in user  
**I want to** rename or delete a todo list  
**So that** I can keep my workspace organized

### US-5: Private lists only
**As a** signed-in user  
**I want** my lists visible only to me  
**So that** other users cannot read or modify my list names

---

## System Requirements

*   All list endpoints require a valid session (`authenticate` middleware).
*   A **list** belongs to exactly one user for its entire lifetime; ownership never changes.
*   Every database read, update, and delete must include `userId: req.user.id` in the `where` clause.
*   On create, set `userId` from `req.user.id` only — **ignore or strip** any `userId` sent in the request body.
*   List names are trimmed before save; empty strings are rejected.
*   Lists are ordered alphabetically by name.
*   This sprint delivers **list CRUD and sidebar UI only** — todo item UI and API are defined in Sprint 3.

---

## Data Ownership & Isolation

Each user owns their lists exclusively. Another authenticated user must not be able to view, rename, or delete them.

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /todo/lists` returns only lists where `userId = req.user.id`. |
| **Write scope** | `PUT` and `DELETE` apply only when the list row matches both `id` and `req.user.id`. |
| **Create scope** | New lists are always owned by the authenticated user. |
| **Cross-user access** | If a list belongs to another user, respond with `404` — never `403` (do not confirm the list exists). |
| **UI scope** | The sidebar shows only lists returned by `GET /todo/lists` for the signed-in user. |
| **Implementation** | Use a shared helper (e.g. `getAccessibleListOrNull(req, listId)`) in `app/authorization/` — do not duplicate scope logic in controllers. |

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/todo/lists` | Yes | Fetch all lists for the authenticated user |
| `POST` | `/todo/lists` | Yes | Create a new list |
| `PUT` | `/todo/lists/:listId` | Yes | Rename a list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete a list owned by the caller |

All endpoints return **only data owned by the authenticated user**. Cross-user access attempts return `404`.

**Create list request body:**
```json
{ "name": "Groceries" }
```

**List success response** (`200` / `201`):
```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.  
**Not found / not owned:** `404` (do not use `403`).

---

## Screen Requirements

### [View: Application Dashboard] — route name `home`
Replaces the Sprint 1 placeholder home page.

**Layout:** split screen using Vuetify grids (`<v-row>`).

| Column | Breakpoint | Contents (this sprint) |
|--------|------------|------------------------|
| Sidebar | `cols="12" md="4"` | List management pane |
| Main | `cols="12" md="8"` | Placeholder for Sprint 3 todo items |

**Sidebar**
*   Heading: **My Lists**
*   `[+ New List]` button opens a `<v-dialog>` with a name `<v-text-field>` and **Create** / **Cancel** actions.
*   Clickable list of list names; active list is visually highlighted.
*   Each list row has a **rename** icon (opens a `<v-dialog>` pre-filled with the current name; **Save** / **Cancel**) and a **delete** icon (opens a confirmation `<v-dialog>`).
*   **Empty state:** **"No lists yet. Create your first list."** when the user has zero lists.

**Main panel (placeholder — Sprint 2)**
*   When a list is selected: heading shows the list name and message **"Todo items will appear here in the next sprint."**
*   When no list is selected: **"Select a list"**
*   **Loading state:** skeleton or progress indicator while lists are fetching.
*   **Error state:** `<v-alert type="error">` for API failures.

**App chrome**
*   Introduce `MenuBar` in this sprint (not present in Sprint 1): signed-in user's name and **Sign out**.
*   `MenuBar` is hidden on login and register routes.

---

## Data Model Requirements

### `lists` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required; max 100 chars |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

### Associations (in `models/index.js`)
*   `User hasMany List`
*   `List belongsTo User`

---

## Acceptance Criteria (Gherkin)

### Lists

#### Scenario: User creates a new list
*   **Given** I am signed in on the dashboard
*   **When** I click **+ New List**
*   **And** I enter list name `Groceries`
*   **And** I confirm the dialog
*   **Then** the API returns `201` with a list object containing `id`, `name`, and `userId`
*   **And** the returned `userId` matches my authenticated user ID
*   **And** `Groceries` appears in the sidebar
*   **And** `Groceries` becomes the selected list
*   **And** the main panel heading shows `Groceries`

#### Scenario: User creates a list with an empty name
*   **Given** I am signed in on the dashboard
*   **When** I open the new list dialog
*   **And** I leave the name field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"List name is required."**
*   **And** no API request is sent

#### Scenario: User creates a list with a name that is too long
*   **Given** I am signed in on the dashboard
*   **When** I submit a list name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "List name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: Dashboard loads with existing lists
*   **Given** I am signed in
*   **And** I own lists `Work` and `Personal`
*   **When** I navigate to the dashboard
*   **Then** both lists appear in the sidebar
*   **And** the first list is selected by default
*   **And** the main panel shows that list's name

#### Scenario: User has no lists
*   **Given** I am signed in
*   **And** I have no lists
*   **When** I navigate to the dashboard
*   **Then** I see **"No lists yet. Create your first list."**
*   **And** the main panel shows **"Select a list"**

#### Scenario: User selects a different list
*   **Given** I am signed in
*   **And** I own lists `Work` and `Personal`
*   **When** I click `Personal` in the sidebar
*   **Then** `Personal` is highlighted as the active list
*   **And** the main panel heading shows `Personal`

#### Scenario: User renames a list
*   **Given** I am signed in
*   **And** I own a list named `Groceries`
*   **When** I rename it to `Shopping`
*   **Then** the API returns `200` with the updated list object
*   **And** the sidebar shows `Shopping` instead of `Groceries`

#### Scenario: User deletes a list
*   **Given** I am signed in
*   **And** I own a list named `Groceries`
*   **When** I delete the list and confirm the dialog
*   **Then** the API returns `200` or `204`
*   **And** the list is removed from the sidebar
*   **And** another owned list is selected if one exists

#### Scenario: User cannot see another user's lists
*   **Given** user B owns list `Secret Project`
*   **And** I am signed in as user A
*   **When** I request `GET /todo/lists`
*   **Then** the response contains only lists owned by user A
*   **And** `Secret Project` is not in the response
*   **And** my sidebar does not show `Secret Project`

#### Scenario: User attempts to rename another user's list
*   **Given** I am signed in as user A
*   **And** a list exists that belongs to user B
*   **When** I send `PUT /todo/lists/:listId` with user B's list ID and body `{ "name": "Hijacked" }`
*   **Then** the API returns `404` with `{ "message": "List with id=<id> not found." }`
*   **And** user B's list name is unchanged in the database

#### Scenario: User attempts to delete another user's list
*   **Given** I am signed in as user A
*   **And** a list exists that belongs to user B
*   **When** I send `DELETE /todo/lists/:listId` with user B's list ID
*   **Then** the API returns `404` with `{ "message": "List with id=<id> not found." }`
*   **And** user B's list still exists

#### Scenario: Client cannot assign a list to another user on create
*   **Given** I am signed in as user A
*   **When** I send `POST /todo/lists` with body `{ "name": "Groceries", "userId": 999 }` where user `999` is a different user
*   **Then** the API returns `201` with a list owned by user A
*   **And** the saved `userId` is user A's ID, not `999`

---

### Authentication (integration with Sprint 1)

#### Scenario: Unauthenticated user accesses the dashboard
*   **Given** I have no session in `localStorage`
*   **When** I navigate to the dashboard
*   **Then** I am redirected to the login page

#### Scenario: Unauthenticated API request to lists
*   **Given** I have no valid session token
*   **When** I request `GET /todo/lists`
*   **Then** the API returns `401` with an unauthorized message

---

## Test Coverage Map

| Area | Tool | Scenarios |
|------|------|-----------|
| `GET /todo/lists` | Jest + supertest | Returns only caller's lists; excludes other users' lists; `401` without token |
| `POST /todo/lists` | Jest + supertest | Happy path, empty name, name too long; ignores spoofed `userId` in body |
| `PUT /todo/lists/:listId` | Jest + supertest | Rename owned list; `404` for another user's list; no mutation of other user's row |
| `DELETE /todo/lists/:listId` | Jest + supertest | Delete owned list; `404` for another user's list; other user's row preserved |
| `Dashboard.vue` (sidebar) | Vitest | Empty list state, list selection, create/rename/delete UI |
| List create dialog | Vitest | Empty name validation |

---

## Out of Scope (Sprint 2)

*   Todo items (see `features/sprint-3-todo-list-item-management.md`)
*   `MenuBar` beyond basic sign-out (full nav deferred if not needed)
*   Drag-and-drop list reordering
*   Sharing lists with other users

---

## Delivered to Sprint 3

The following are intentionally deferred to the next feature spec:

*   `todos` table and associations
*   Main-panel todo list UI (add, complete, edit, delete items)
*   `GET/POST /todo/lists/:listId/todos` and `PUT/DELETE /todo/todos/:id`
