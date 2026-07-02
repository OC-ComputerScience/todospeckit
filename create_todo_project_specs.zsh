#!/bin/zsh

echo "🏗️ Starting local macOS Zsh environment setup..."

# 1. Create directories safely
mkdir -p .cursor/rules
mkdir -p features

# 2. Generate the Global Constitution
echo "Writing constitution.mdc..."
cat << 'EOF' > .cursor/rules/constitution.mdc
---
description: THE CODELINE CONSTITUTION. This is the supreme law of the repository. Every code modification, commit, and AI interaction must comply with these core operational principles.
globs: "**/*"
---
# 👑 The Global Project Constitution

This document establishes the absolute operational guardrails for this engineering project. All team members and AI execution loops must respect these principles. Any code generation that violates this constitution must be rejected immediately.

## 📜 Principle 1: Spec-Driven Absolute Truth
*   **The Law:** No application code may be generated, modified, or refactored unless there is a corresponding, explicit requirement written in a Markdown file inside the `features/` directory.
*   **The Guardrail:** If a developer prompts you to build a feature, you must first ask: "Where is the feature markdown file specification?" If it does not exist, refuse to generate the code.

## 🌿 Principle 2: Branching & Git Discipline
*   **The Law:** You are strictly forbidden from writing or pushing changes directly to the `main` or `master` branches.
*   **The Guardrail:** All feature development must take place on dedicated feature branches named according to this pattern: `feature/sprint-[X]-[feature-name]` (e.g., `feature/sprint-1-login-form`).

## 🧪 Principle 3: No Ghost Testing / Strict Verification
*   **The Law:** Code cannot be considered "Done" until a matching automated test suite passes. 
*   **The Guardrail:** You must never write a feature file block without also updating or generating its matching test verification parameters. You are forbidden from writing tests that merely assert true === true; tests must actively attempt to break the code using edge-case inputs.

## 🛑 Principle 4: Atomic Commit Generation
*   **The Law:** Do not execute massive, sweeping changes across dozens of files at the same time.
*   **The Guardrail:** Work iteratively. Implement changes in micro-steps (e.g., build the database schema first, verify it, then move to the API route, verify it, then move to the UI layout). 

## 🤖 Principle 5: The Developer is the Tech Lead
*   **The Law:** The AI is the executor; the human student is the Architect and Auditor.
*   **The Guardrail:** You must explain *why* you chose a specific logical architecture block if asked. Do not hide complex code or dependencies. If you notice a logical contradiction in the student's feature file specifications, alert them immediately rather than writing broken code.
EOF

# 3. Generate the UI Framework rule
echo "Writing ui-style-system.mdc..."
cat << 'EOF' > .cursor/rules/ui-style-system.mdc
---
description: Global Design System and UI Component Style Guide. Applies automatically to all frontend screens, layouts, typography, colors, and responsive patterns using Vuetify 3 (NO TAILWIND).
globs: "src/frontend/**/*, **/*.vue"
---
# Global UI Style System & Component Patterns

You must strictly enforce this unified design system across all files. Do not create custom styles, do not freelance with spacing sizes, and do not introduce unapproved colors.

## 🎨 1. Core Color System & UI Framework
*   **Framework:** Vuetify 3 (Composition API syntax only).
*   **Tailwind Prohibition:** Do NOT use Tailwind CSS classes. Rely strictly on Vuetify's built-in utility classes and grid properties.
*   **Colors:** Use standard theme attributes (`primary`, `secondary`, `success`, `error`, `warning`). Never hardcode hex values.

## 📐 2. Structural Layout & Spacing Patterns
*   **Grids:** All layout spacing must be built using `<v-container>`, `<v-row>`, and `<v-col>`.
*   **Responsiveness:** Use responsive column breakpoints explicitly: `<v-col cols="12" md="6" lg="4">`.
*   **Margins/Padding:** Use Vuetify's built-in spacing utilities (e.g., `class="pa-4 ma-2"`).

## 📦 3. Standard Component Structural Blueprints
*   **Inputs:** Always use `<v-text-field variant="outlined" density="comfortable">`.
*   **Buttons:** Always use `<v-btn color="primary" elevation="1">`.
*   **Tables:** Always use `<v-data-table>` or `<v-table>`.
*   **Cards:** Always use `<v-card variant="flat" border class="rounded-lg">`.

## 🚨 4. Standard Component Lifecycle States
Every component view must build out or accommodate these lifecycle slots:
1.  **Loading:** Use `<v-skeleton-loader>`.
2.  **Empty:** Use `<v-empty-state>` when data collections array lengths match 0.
3.  **Error Feedback:** Mount a floating `<v-alert type="error" closable>`.
EOF

# 4. Generate the API backend conventions rule
echo "Writing api-conventions.mdc..."
cat << 'EOF' > .cursor/rules/api-conventions.mdc
---
description: Global Backend Architecture System. Automatically enforces API route design, HTTP response standards, database query safety, and error handling across all backend code using Node, Express, and Sequelize.
globs: "src/backend/**/*, controllers/**/*, models/**/*, **/*.routes.js"
---
# Global API Architecture & Database Conventions

You are a strict Principal Backend Architect. When generating backend server routes, API endpoints, database queries, schemas, or controllers, you must strictly adhere to these architectural design rules.

## 📡 1. RESTful API Routing Conventions
All API endpoints must follow standard plural REST guidelines:
*   `GET /api/lists` -> Fetch all lists owned by user.
*   `POST /api/lists` -> Create a brand new list container.
*   `GET /api/lists/:listId/todos` -> Fetch all todos inside a specific list.
*   `POST /api/lists/:listId/todos` -> Add a task item inside a specific list.
*   `PUT /api/todos/:id` -> Update a specific task state (e.g., completed).
*   `DELETE /api/todos/:id` -> Remove a task resource safely.

## 📦 2. Standardized JSON Envelope Responses
Every API response must be wrapped inside a uniform JSON envelope:
*   **Success Payload Structure (HTTP 200/201):**
    ```json
    {
      "success": true,
      "data": { ... }
    }
    ```
*   **Failure Payload Structure (HTTP 4xx/5xx):**
    ```json
    {
      "success": false,
      "error": {
        "code": "ERROR_CONSTANT_STRING",
        "message": "Human-readable descriptive error explanation string."
      }
    }
    ```
EOF

# 5. Generate the Tenant Security Isolation rule
echo "Writing security.mdc..."
cat << 'EOF' > .cursor/rules/security.mdc
---
description: Multi-tenant application security paradigm. Restricts all Sequelize queries to current active token context boundaries.
globs: "src/backend/**/*, controllers/**/*, models/**/*"
---
# 🔒 Tenant Isolation & Access Control Security

You are a Security Engineer. You must protect the multi-tenant architecture against Cross-User Data Leaks.

## 👤 1. Strict Tenant Boundary Isolation
*   **The Law:** No database row can be fetched, inserted, or updated without explicitly scoping the query filter to the authenticated user's ID.
*   **Sequelize Guardrail:** Every single query option block must pass an explicit user constraint matching the token value decoded via middleware.
    ```javascript
    where: { id: listId, userId: req.user.id }
    ```
*   **Data Leak Prohibition:** Never trust a payload input block containing a `userId` attribute submitted by the client. Override it strictly with `req.user.id` on the server layer.
EOF

# 6. Generate the QA/Testing rule
echo "Writing testing-standards.mdc..."
cat << 'EOF' > .cursor/rules/testing-standards.mdc
---
description: Rules managing automated test verification scripts using Jest (Backend) and Vitest (Frontend).
globs: "**/*.test.js, **/*.spec.js, **/tests/**/*"
---
# 🧪 Quality Assurance & Test Verification Standards

You must ensure that code execution states match our target baseline specifications. Ghost testing is forbidden.

## 1. Backend Interaction Target Constraints (Jest)
*   Every API controller endpoint must map to a complete integration test using `supertest`.
*   **The Happy/Sad path constraint:** For every successful functional route test assertion, you must write at least two alternative sad-path failure loops testing input gaps, negative validation failures, and expired authorizations.

## 2. Frontend Layout Checking (Vitest)
*   Components housing reactive state behaviors must be mounted via `@vue/test-utils` inside Vitest scripts.
*   Assert that conditional layouts change state flags properly on interaction triggers.
EOF

# 7. Generate Sprint 1 Requirements
echo "Writing sprint-1-user-auth.md..."
cat << 'EOF' > features/sprint-1-user-auth.md
# Feature: Multi-User Authentication Pipeline

## 📈 System Requirements
*   Build a user registration and session management token engine.
*   Passwords must be safely hashed via bcrypt before saving to the database.

## 🚦 Acceptance Criteria (Gherkin Format)
### Scenario: User Registers with Missing Fields
*   Given a user navigates to the registration form layout view
*   When the user submits the action without inputting an email parameter values
*   Then the UI framework must trigger inline component field validation rules
*   And block transmission to the API layer, rendering text message: "Email is required."
EOF

# 8. Generate Sprint 2 Requirements
echo "Writing sprint-2-todo-management.md..."
cat << 'EOF' > features/sprint-2-todo-management.md
# Feature: Multi-List & Todo Management Engine

## 🖥️ Screen Layout Requirements
### [View: Application Dashboard Page]
*   Grid Layout: Split screen layout using Vuetify grids (`<v-row>`).
    *   Sidebar Column (`cols="12" md="4"`): Contains a list selection pane for todo folders. Top contains a `[+ New List]` action button.
    *   Main Column (`cols="12" md="8"`): Shows the active todo group canvas and list rows.

## 🚦 Acceptance Criteria (Gherkin Format)
sh