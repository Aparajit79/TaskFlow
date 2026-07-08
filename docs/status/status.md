# TaskFlow Project Status & Development Roadmap

This document outlines the features currently implemented in TaskFlow, defines the current development phase, and lists proposed upgrades to elevate the application to a production-grade version.

---

## 🚀 Current Features

### 1. 🖥️ Frontend Client (React 18 + Vite + Vanilla CSS)
* **View Navigation**: Tab-based views including `Home`, `Project` (Task Board), `Dashboard` (Analytics), and `Settings`.
* **Theme Customization**: Global Light/Dark mode toggling, persisted via `localStorage`.
* **State Management**: React Context (`TaskFlowContext`) serving as a single source of truth for projects, tasks, and members, with synchronized database updates.
* **Component-Based UI**: Dedicated modular layout components for Task Lists, Task Forms, Sidebar, and Team Members.

### 2. 🗃️ Project Management
* **Workspace Isolation**: Create and switch between multiple active projects.
* **Cascading Cleanup**: Deleting a project automatically triggers deletion of all associated tasks and team members.

### 3. 👥 Team Member Management
* **Resource Assignment**: Add members with dedicated names and professional roles.
* **Dynamic Avatars**: Automatically generates initials-based avatars for visual representation.
* **Direct Deletion**: Ability to remove members from the project workspace.

### 4. 📝 Task Management
* **Rich Task Attributes**: Tasks contain a Title, Description, Priority (Low/Medium/High), Status (Pending/In Progress/Blocker), Due Date, and Assigned Member.
* **Form Validation**:
  * Mandatory title field (visualized with a red `*` symbol).
  * Future due-date restriction (due dates cannot be in the past).
  * High-priority constraints (High-priority tasks mandate a due date).
* **Operational Control**: Support for task creation, complete edit/override, completion toggling, and removal.

### 5. 📊 Analytics & Reporting
* **Task Metrics**: Real-time progress trackers that show completion rates, status breakdown, and priority statistics.

### 6. 🔌 Backend API Server (Node.js + Express.js)
* **RESTful Endpoints**: Full CRUD endpoints for `/api/projects`, `/api/members`, and `/api/tasks`.
* **Database Pooling**: Robust connection pooling to PostgreSQL via `pg`.
* **CORS Integration**: Pre-configured cross-origin request policies allowing seamless connection with the Vite dev client.

### 7. 💾 Database Schema (PostgreSQL)
* Relational tables structured with Primary Keys, Foreign Keys, and `ON DELETE CASCADE` constraints.

---

## 📍 Current Phase: Phase 1 (Core MVP Persistence)
TaskFlow is currently in **Phase 1 (Minimum Viable Product with Persistence)**. 
* All basic task manager features are operational.
* Data is stored persistently in a relational database.
* Fundamental validation rules and state syncs are in place.

---

## 🛠️ Upgrades Required for Version Progression (Phase 2 & Beyond)

To elevate TaskFlow from a basic MVP to a production-ready application (v1.1.0 / v2.0.0), the following upgrades are recommended:

### 1. 🔐 User Authentication & Multi-Tenancy (High Priority)
* **Upgrade**: Add User signup/login utilizing JSON Web Tokens (JWT) or sessions.
* **Benefit**: Restrict users to only see and modify their own projects, adding data privacy and secure multi-tenancy.

### 2. 🔍 Advanced Searching, Filtering, and Sorting (Medium Priority)
* **Upgrade**: Add search bars to search titles/descriptions and dropdowns to sort by due date, creation date, or priority.
* **Benefit**: Dramatically improves usability for workspaces containing dozens of tasks.

### 3. ⏱️ Activity Audit Trails & History Log (Medium Priority)
* **Upgrade**: Introduce a history log table in the database and record log messages whenever a task is created, edited, assigned, or completed.
* **Benefit**: Allows teams to track who performed what changes and when.

### 4. 🔄 Offline Mode & Service Workers (Low Priority)
* **Upgrade**: Store changes locally in IndexedDB when network connection is lost, and sync back to the database automatically when online.
* **Benefit**: Provides resilience and guarantees uninterrupted user access.

### 5. 📎 File Attachments (Low Priority)
* **Upgrade**: Integrate file upload (via AWS S3 or disk storage) to allow users to attach documents, mockups, or screenshots to task descriptions.
* **Benefit**: Simplifies task context by centralizing related materials.

### 6. 🧪 Comprehensive Automated Testing (High Priority)
* **Upgrade**: Implement frontend unit and component tests (using Vitest and React Testing Library) to pair with the existing backend tests.
* **Benefit**: Prevents regressions during rapid feature deployment.
