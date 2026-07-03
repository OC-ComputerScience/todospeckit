# Feature: User Authentication & Session Management

**Sprint:** 1  
**Branch pattern:** `feature/sprint-1-user-auth`

---

## User Stories

### US-1: Register an account
**As a** new user  
**I want to** create an account with my name, email, username, and password  
**So that** I can sign in and manage my own private todo lists

### US-2: Sign in
**As a** registered user  
**I want to** sign in with my username and password  
**So that** I can access the application dashboard securely

### US-3: Stay signed in across page loads
**As a** signed-in user  
**I want** my session to persist in the browser  
**So that** I do not have to sign in again every time I refresh the page

### US-4: Sign out
**As a** signed-in user  
**I want to** sign out  
**So that** no one else can use my account on a shared device

### US-5: Block unauthenticated access
**As the** application  
**I want to** require a valid session for all non-auth screens  
**So that** users can only see and modify their own data

---

## System Requirements

*   Users authenticate with **username** + **password** (not email-only login).
*   Registration collects: first name, last name, email, username, password.
*   Passwords are hashed with **bcrypt** (`SALT_ROUNDS = 10`) before persistence; hashes are never returned by the API.
*   Sessions use a **JWT + Session table** pattern: token stored server-side; client sends `Authorization: Bearer <token>`.
*   Session lifetime: **24 hours** from creation.
*   Reuse a non-expired session for the same user on login when one already exists.
*   Default role for new users: `worker`.
*   **Data ownership foundation:** every authenticated request must resolve to exactly one user via `req.user.id` from the session token. Later sprints scope all lists and todo items to this ID.
*   **Frontend email validation:** registration uses shared `emailRules` from `frontend/src/config/validation.js` — required plus regex format check (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`); invalid format message: **"Enter a valid email address."**

---

## Data Ownership & Isolation (foundation)

Sprint 1 establishes identity; Sprints 2–3 enforce per-user data boundaries.

*   Each user account is a separate tenant boundary for todo lists and items.
*   No API in this sprint returns another user's profile or session.
*   Sprint 2+ must never expose lists or todos across users — not in list responses, detail views, or error messages that confirm another user's resource exists.

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/todo/register` | No | Create a new user account |
| `POST` | `/todo/login` | No | Authenticate and return session payload |
| `POST` | `/todo/logout` | Yes | Invalidate current session token |

**Login / register success response** (flat JSON, no envelope):
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

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.

---

## Screen Requirements

### [View: Login Page] — route name `login`
*   Full-screen auth layout (no `MenuBar`).
*   Fields: username, password.
*   Primary action: **Sign in** (`v-btn`, shows `:loading` while request is in flight).
*   Link or button to navigate to registration.
*   Inline error via `<v-alert type="error">` on failed login.

### [View: Register Page] — route name `register`
*   Full-screen auth layout (no `MenuBar`).
*   Fields: first name, last name, email, username, password, confirm password.
*   Email field uses shared `emailRules` from `frontend/src/config/validation.js` (required + regex format).
*   Primary action: **Create account**.
*   Link or button to navigate to login.
*   Client-side validation before API call; server errors shown via `<v-alert type="error">`.

### [View: Dashboard placeholder] — route name `home`
*   Minimal protected landing page shown after successful login (full dashboard built in Sprint 2).
*   Displays a welcome message using the user's first name.
*   **No `MenuBar`** in Sprint 1 — auth pages and this placeholder use a full-screen layout only.
*   **Sign out** button on this page (standalone `v-btn`; removed from page content when `MenuBar` is added in Sprint 2).

---

## Data Model Requirements

### `users` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; stored lowercase |
| `password` | STRING(255) | Required; bcrypt hash only |
| `role` | STRING(20) | Default `worker` |

### `sessions` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required |
| `userId` | INTEGER FK | Required, references `users.id` |

---

## Acceptance Criteria (Gherkin)

### Registration

#### Scenario: User registers with valid information
*   **Given** I am on the registration page
*   **When** I enter valid first name, last name, email, username, password, and matching confirm password
*   **And** I submit the form
*   **Then** the API returns `201` with a user payload including `userId`, `username`, `email`, `token`, and `role`
*   **And** my user record is stored in the database with a bcrypt password hash
*   **And** I am redirected to the home page
*   **And** my session is stored in `localStorage` under the key `user`

#### Scenario: User submits registration with missing email
*   **Given** I am on the registration page
*   **When** I leave the email field empty
*   **And** I submit the form
*   **Then** inline validation blocks the request
*   **And** I see the message **"Email is required."**
*   **And** no API request is sent

#### Scenario: User submits registration with invalid email format
*   **Given** I am on the registration page
*   **When** I enter a value that is not a valid email address (e.g. `notanemail`)
*   **And** I submit the form
*   **Then** inline validation blocks the request
*   **And** I see the message **"Enter a valid email address."**
*   **And** no API request is sent

#### Scenario: User submits registration with missing username
*   **Given** I am on the registration page
*   **When** I leave the username field empty
*   **And** I submit the form
*   **Then** inline validation blocks the request
*   **And** I see the message **"Username is required."**
*   **And** no API request is sent

#### Scenario: User submits registration with password too short
*   **Given** I am on the registration page
*   **When** I enter a password with fewer than 8 characters
*   **And** I submit the form
*   **Then** inline validation blocks the request
*   **And** I see the message **"Password must be at least 8 characters."**

#### Scenario: User submits registration with mismatched passwords
*   **Given** I am on the registration page
*   **When** password and confirm password do not match
*   **And** I submit the form
*   **Then** inline validation blocks the request
*   **And** I see the message **"Passwords do not match."**

#### Scenario: User registers with a duplicate username
*   **Given** a user with username `jdoe` already exists
*   **When** I submit registration with username `jdoe`
*   **Then** the API returns `400` with `{ "message": "Username is already taken." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User registers with a duplicate email
*   **Given** a user with email `jane@example.com` already exists
*   **When** I submit registration with email `jane@example.com`
*   **Then** the API returns `400` with `{ "message": "Email is already registered." }`
*   **And** the error is displayed in a `<v-alert type="error">`

---

### Login

#### Scenario: User signs in with valid credentials
*   **Given** I am on the login page
*   **And** a registered user exists with username `jdoe` and a known password
*   **When** I enter username `jdoe` and the correct password
*   **And** I click **Sign in**
*   **Then** the API returns `200` with a payload containing `userId`, `username`, `token`, and `role`
*   **And** a session row is created or reused in the database
*   **And** I am redirected to the home page
*   **And** my session is stored in `localStorage` under the key `user`

#### Scenario: User signs in with invalid password
*   **Given** I am on the login page
*   **And** a registered user exists with username `jdoe`
*   **When** I enter username `jdoe` and an incorrect password
*   **And** I click **Sign in**
*   **Then** the API returns `401` with `{ "message": "Invalid username or password." }`
*   **And** I remain on the login page
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User signs in with missing username
*   **Given** I am on the login page
*   **When** I leave the username field empty
*   **And** I click **Sign in**
*   **Then** inline validation blocks the request
*   **And** I see the message **"Username is required."**
*   **And** no API request is sent

#### Scenario: User signs in with missing password
*   **Given** I am on the login page
*   **When** I leave the password field empty
*   **And** I click **Sign in**
*   **Then** inline validation blocks the request
*   **And** I see the message **"Password is required."**
*   **And** no API request is sent

#### Scenario: Signed-in user visits login page
*   **Given** I have a valid session in `localStorage`
*   **When** I navigate to the login page
*   **Then** I am redirected to the home page

---

### Logout

#### Scenario: User signs out
*   **Given** I am signed in on the home page
*   **When** I click **Sign out**
*   **Then** the API invalidates my session token on the server
*   **And** `localStorage` key `user` is removed
*   **And** I am redirected to the login page

---

### Route protection & session handling

#### Scenario: Unauthenticated user accesses a protected route
*   **Given** I have no session in `localStorage`
*   **When** I navigate directly to the home page
*   **Then** I am redirected to the login page

#### Scenario: API request includes session token
*   **Given** I am signed in
*   **When** the frontend makes an authenticated API request
*   **Then** the request includes header `Authorization: Bearer <token>`

#### Scenario: Expired or invalid session token
*   **Given** I am signed in with an expired or revoked token
*   **When** the frontend makes an authenticated API request
*   **Then** the API returns `401` with an unauthorized message
*   **And** `localStorage` key `user` is cleared
*   **And** I am redirected to the login page

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Area | Tool | Scenarios |
|------|------|-----------|
| `POST /todo/register` | Jest + supertest | Registration happy path, duplicate username, duplicate email, missing fields, short password |
| `POST /todo/login` | Jest + supertest | Valid login, invalid password, missing username/password |
| `POST /todo/logout` | Jest + supertest | Valid logout, missing token |
| `authenticate` middleware | Jest + supertest | Valid token, missing token, expired token |
| `Register.vue` | Vitest (`Register.test.js`) | Client-side validation scenarios (missing email, invalid email format, missing username, password rules, mismatch) |
| `Login.vue` | Vitest | Client-side validation, error display on failed login |
| `router.js` guards | Vitest | Unauthenticated redirect, signed-in redirect away from login |

---

## Out of Scope (Sprint 1)

*   Password reset (`POST /todo/reset-password`)
*   Email verification
*   OAuth / social login
*   Admin user management
*   Full todo dashboard (Sprint 2)
