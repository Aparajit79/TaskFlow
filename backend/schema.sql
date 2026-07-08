-- 1. Create a custom isolated schema namespace
CREATE SCHEMA IF NOT EXISTS task_matrix;

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS task_matrix.projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Members Table
CREATE TABLE IF NOT EXISTS task_matrix.members (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES task_matrix.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    avatar VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_member UNIQUE (project_id, name)
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS task_matrix.tasks (
    id BIGINT PRIMARY KEY,
    project_id INT NOT NULL REFERENCES task_matrix.projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    description TEXT,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    due_date DATE,
    assigned_member_id INT REFERENCES task_matrix.members(id) ON DELETE SET NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Indexes for optimization
CREATE INDEX IF NOT EXISTS idx_members_project_id ON task_matrix.members(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON task_matrix.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_member_id ON task_matrix.tasks(assigned_member_id);
