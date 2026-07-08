const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'task_matrix',
  password: process.env.DB_PASSWORD || '123',
  port: process.env.DB_PORT || 5432,
  options: '-c search_path=task_matrix'
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client from PostgreSQL connection pool:', err.stack);
  }
  console.log('Connected to PostgreSQL database successfully!');
  release();
});

app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM projects ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO projects (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *',
      [name.trim()]
    );
    res.status(201).json({ message: 'Project added successfully', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error adding project' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    res.json({ message: `Project and its tasks deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error deleting project' });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, project_id AS "projectId", name, role, avatar FROM members ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching team members' });
  }
});

app.post('/api/members', async (req, res) => {
  const { projectId, name, role } = req.body;
  if (!projectId || !name || !role) {
    return res.status(400).json({ error: 'ProjectId, name, and role are required' });
  }

  const avatar = name.trim().charAt(0).toUpperCase();

  try {
    const result = await pool.query(
      'INSERT INTO members (project_id, name, role, avatar) VALUES ($1, $2, $3, $4) RETURNING id, project_id AS "projectId", name, role, avatar',
      [projectId, name.trim(), role, avatar]
    );
    res.status(201).json({ message: 'Team member added successfully', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error adding team member' });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM members WHERE id = $1', [id]);
    res.json({ message: 'Team member removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error removing member' });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id::text, 
        project_id AS "projectId", 
        text, 
        description, 
        priority, 
        status, 
        to_char(due_date, 'YYYY-MM-DD') AS "dueDate", 
        assigned_member_id AS "assignedMemberId", 
        completed 
      FROM tasks 
      ORDER BY created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { id, projectId, text, description, priority, status, dueDate, assignedMemberId } = req.body;
  if (!id || !projectId || !text) {
    return res.status(400).json({ error: 'Task ID, projectId, and title are required' });
  }

  const formattedDueDate = dueDate && dueDate !== '' ? dueDate : null;
  const formattedAssignedMemberId = assignedMemberId && assignedMemberId !== '' ? Number(assignedMemberId) : null;

  try {
    const result = await pool.query(
      `INSERT INTO tasks (id, project_id, text, description, priority, status, due_date, assigned_member_id, completed) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE) 
       RETURNING id::text, project_id AS "projectId", text, description, priority, status, to_char(due_date, 'YYYY-MM-DD') AS "dueDate", assigned_member_id AS "assignedMemberId", completed`,
      [id, projectId, text.trim(), description, priority || 'Medium', status || 'Pending', formattedDueDate, formattedAssignedMemberId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error adding task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { text, description, priority, status, dueDate, assignedMemberId, completed } = req.body;

  try {
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = taskResult.rows[0];

    const formattedDueDate = dueDate !== undefined ? (dueDate && dueDate !== '' ? dueDate : null) : task.due_date;
    const formattedAssignedMemberId = assignedMemberId !== undefined ? (assignedMemberId && assignedMemberId !== '' ? Number(assignedMemberId) : null) : task.assigned_member_id;
    const completedVal = completed !== undefined ? completed : task.completed;
    const textVal = text !== undefined ? text.trim() : task.text;
    const descriptionVal = description !== undefined ? description : task.description;
    const priorityVal = priority !== undefined ? priority : task.priority;
    const statusVal = status !== undefined ? status : task.status;

    const result = await pool.query(
      `UPDATE tasks 
       SET text = $1, description = $2, priority = $3, status = $4, due_date = $5, assigned_member_id = $6, completed = $7 
       WHERE id = $8 
       RETURNING id::text, project_id AS "projectId", text, description, priority, status, to_char(due_date, 'YYYY-MM-DD') AS "dueDate", assigned_member_id AS "assignedMemberId", completed`,
      [textVal, descriptionVal, priorityVal, statusVal, formattedDueDate, formattedAssignedMemberId, completedVal, id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error updating task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error deleting task' });
  }
});

app.listen(PORT, () => {
  console.log(`TaskMatrix API Server is running on port ${PORT}`);
});
