# TaskFlow Project Status & Development Roadmap

This document outlines the features currently implemented in TaskFlow, defines the current development phase, and lists proposed upgrades to elevate the application to a production-grade version.

---

## 🚀 Current Features

### 1. 🖥️ Frontend Client (React 19 + Vite + Vanilla CSS)
* **View Navigation**: Tab-based views including:
  * `Home` (Dashboard Hub showing project-wide statistics and task previews).
  * `Project` (Interactive Task Board/List).
  * `Dashboard` (Detailed analytics charts and metrics breakdown).
  * `PowerQuery` (Developer console for advanced safe queries).
  * `Team` (Workspace member manager).
  * `Settings` (Preferences).
  * `Help` (User documentation and API schema references).
* **Theme Customization**: Global Light/Dark mode toggling, persisted via `localStorage` and mapped using custom CSS properties.
* **State Management**: React Context (`TaskFlowContext`) serving as a single source of truth for projects, tasks, and members, with synchronized database updates.
* **Component-Based UI**: Dedicated modular layout components for Task Lists, Task Forms, Sidebar, and Team Members. Uses modern Lucide icons.

### 2. 🗃️ Project Management
* **Workspace Isolation**: Create, view, and switch between multiple active project workspaces.
* **Cascading Cleanup**: Deleting a project automatically triggers backend deletion of all associated tasks and team members.

### 3. 👥 Team Member Management
* **Resource Assignment**: Add members with dedicated names and professional roles to specific projects.
* **Dynamic Avatars**: Automatically generates initials-based colored avatars for visual representation in lists and task items.
* **Direct Deletion**: Ability to remove members from the project workspace with automatic unassignment on associated tasks.

### 4. 📝 Task Management
* **Rich Task Attributes**: Tasks contain a Title, Description, Priority (Low/Medium/High), Status (Pending/In Progress/Blocker), Due Date, and Assigned Member.
* **Form Validation**:
  * Mandatory title field (visualized with a red `*` symbol).
  * Future due-date restriction (due dates cannot be in the past).
  * High-priority constraints (High-priority tasks mandate a due date).
* **Operational Control**: Support for task creation, complete edit/override, completion toggling, and removal.

### 5. 📊 Analytics & Reporting
* **Task Metrics**: Real-time progress trackers that show completion rates, status breakdown, and priority statistics.

### 6. ⚡ HTTP QUERY Engine & Caching (Power Query)
* **Safe Payload Querying**: Custom endpoint `/api/tasks/query` supporting both HTTP `QUERY` (RFC 10008) and fallback POST for structured task search.
* **In-Memory Query Cache**: Efficient in-memory caching system on Express server that uses order-independent SHA-256 hashing of request bodies as cache keys.
* **Cache Invalidation**: Automatically clears query cache when writing actions (POST/PUT/DELETE) are performed on tasks, members, or projects.
* **Performance Headers**: Exposes backend caching telemetry (`X-Cache: HIT/MISS`, `X-Response-Time`, and `X-Response-Method`) to client diagnostics.
* **Request Debugger**: Built-in developer console displaying raw HTTP request headers, payload body, response latency, cache HIT/MISS status, and query results.

### 7. 🔌 Backend API Server (Node.js + Express.js)
* **RESTful Endpoints**: Full CRUD endpoints for `/api/projects`, `/api/members`, and `/api/tasks`.
* **Database Pooling**: Robust connection pooling to PostgreSQL via `pg` with configured schemas.
* **CORS Integration**: Pre-configured cross-origin request policies allowing seamless connection with the Vite dev client.
* **Diagnostics API**: `/api/cache-debug` to debug and inspect the current status and size of the cache store.

### 8. 💾 Database Schema (PostgreSQL)
* Relational tables structured with Primary Keys, Foreign Keys, and `ON DELETE CASCADE` / `ON DELETE SET NULL` constraints.
* Optimization indexes (`idx_members_project_id`, `idx_tasks_project_id`, `idx_tasks_assigned_member_id`) built on foreign key columns.

### 9. 🧪 Automated Testing
* **Validation Tests**: Pure unit tests (`tests/taskValidator.test.js`) verifying form logic and boundary cases using Node's native test runner (`node:test`).
* **API Integration Tests**: Core integration tests (`tests/api.test.js`) verifying CRUD functionality, Cascade deletion, and HTTP QUERY caching Hit/Miss mechanisms.

---

## 📍 Current Phase: Phase 1.5 (Core Feature-Complete with Query Caching)
TaskFlow has progressed beyond a basic MVP and is currently in **Phase 1.5 (Advanced Persistence & Caching)**. 
* All task management and team tracking features are fully operational.
* Backend query engine supports caching and diagnostics.
* Local unit and API integration testing suites are active.

---

## 🛠️ Upgrades Required for Version Progression (Phase 2 & Beyond)

To elevate TaskFlow from a feature-rich beta to a production-ready enterprise application, the following upgrades are recommended:

### 1. 🔐 User Authentication & Multi-Tenancy (High Priority)
* **Upgrade**: Add User signup/login utilizing JSON Web Tokens (JWT) or sessions.
* **Benefit**: Restrict users to only see and modify their own projects, adding data privacy and secure multi-tenancy.

### 2. ⏱️ Activity Audit Trails & History Log (Medium Priority)
* **Upgrade**: Introduce a history log table in the database and record log messages whenever a task is created, edited, assigned, or completed.
* **Benefit**: Allows teams to track who performed what changes and when.

### 3. 🔄 Real-time Sync & WebSockets (High Priority)
* **Upgrade**: Integrate Socket.io or native WebSockets to instantly broadcast changes (task updates, new projects, board edits) across all connected clients.
* **Benefit**: Enhances collaboration by avoiding manual page refreshes when multiple team members edit the same board.

### 4. 🗂️ Interactive Kanban Board View (Medium Priority)
* **Upgrade**: Build a drag-and-drop Kanban view based on Task Status (`Pending`, `In Progress`, `Blocker`) using a library like `@hello-pangea/dnd`.
* **Benefit**: Provides a visual, highly interactive workflow manager for agile teams.

### 5. 📥 CSV/JSON Import & Export Engine (Medium Priority)
* **Upgrade**: Implement CSV import and export utilizing `papaparse` for easy task backups, sharing, or migrating tasks from third-party tools.
* **Benefit**: Simplifies workspace sharing and data ingestion/migration.

### 6. 📝 Subtask Checklists & Task Hierarchy (Medium Priority)
* **Upgrade**: Allow users to add a checklist of checklist-items/subtasks inside a task to track granular progress.
* **Benefit**: Avoids cluttering the main task board with tiny sub-steps.

### 7. 🧪 Expanded Frontend Test Coverage (High Priority)
* **Upgrade**: Implement component and state tests using Vitest and React Testing Library.
* **Benefit**: Guarantees component resilience and prevents regression when updating the UI.

### 8. 🔄 Offline Mode & Service Workers (Low Priority)
* **Upgrade**: Store changes locally in IndexedDB when network connection is lost, and sync back to the database automatically when online.
* **Benefit**: Provides resilience and guarantees uninterrupted user access.

### 9. 📎 File Attachments (Low Priority)
* **Upgrade**: Integrate file upload (via AWS S3 or local storage) to allow users to attach documents, mockups, or screenshots to task descriptions.
* **Benefit**: Simplifies task context by centralizing related materials.
