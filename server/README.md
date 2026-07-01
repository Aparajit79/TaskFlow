# TaskMatrix Backend Setup Guide (PostgreSQL & Node.js)

Follow this guide to deploy and configure the PostgreSQL database and Express API server on another system.

## 1. Prerequisites
Ensure you have the following installed on the target system:
1. **Node.js** (v18.0.0 or higher) and **npm**
2. **PostgreSQL** database server

---

## 2. PostgreSQL Database Setup
Connect to your PostgreSQL server (using pgAdmin, psql, or another client tool) and execute these steps:

### A. Create Database
Create a new database named `taskflow_db` (or any name you prefer):
```sql
CREATE DATABASE taskflow_db;
```

### B. Create Tables (Schema)
Connect to the `taskflow_db` database and run the queries defined in the [schema.sql](./schema.sql) file to create the tables and seed default mock values:
```sql
-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    name VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Team Members Table
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    project VARCHAR(255) REFERENCES projects(name) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    avatar VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT PRIMARY KEY,
    project VARCHAR(255) REFERENCES projects(name) ON DELETE CASCADE,
    text TEXT NOT NULL,
    description TEXT,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    due_date DATE,
    assigned_member VARCHAR(255),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Defaults
INSERT INTO projects (name) VALUES 
('Personal'), ('Work'), ('college'), ('Things to buy')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (id, project, text, description, priority, status, due_date, assigned_member, completed) VALUES
(1, 'Personal', 'Learn React', 'Complete React basics and hooks', 'High', 'In Progress', NULL, '', FALSE)
ON CONFLICT DO NOTHING;
```

---

## 3. Server Configuration & Launch

### A. Navigate to Server Directory
Open your terminal on the target system and navigate to the `server/` directory:
```bash
cd server
```

### B. Install Dependencies
Run the install command to fetch all required Node.js libraries:
```bash
npm install
```

### C. Create Environment Variables Configuration
Duplicate the `env.example` file and rename it to `.env`:
```bash
cp env.example .env
```
Open `.env` in a text editor and fill in your PostgreSQL credentials:
```env
PORT=5000
DB_USER=your_postgres_username      # Default is usually 'postgres'
DB_HOST=localhost                  # IP or Hostname of the DB server
DB_NAME=taskflow_db                # Database name
DB_PASSWORD=your_db_password       # Your actual password
DB_PORT=5432                       # Default PostgreSQL port
```

### D. Start Server
Run the startup script:
- For development (with hot-reload):
  ```bash
  npm run dev
  ```
- For production:
  ```bash
  npm start
  ```
The server will boot and display:
```text
Connected to PostgreSQL database successfully!
TaskMatrix API Server is running on port 5000
```

---

## 4. Connecting the Frontend Client
If the frontend React client is running on a different system or port, ensure the client's `.env` file (in the project root) points to the correct backend IP:
```env
VITE_API_URL=http://<YOUR_SERVER_IP>:5000/api
```
Example:
```env
VITE_API_URL=http://localhost:5000/api
```
After editing, compile/rebuild or restart the React development server:
```bash
npm run dev
```
