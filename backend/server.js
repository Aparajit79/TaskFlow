const express = require('express');
const crypto = require('crypto');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  exposedHeaders: ['X-Cache', 'X-Response-Time', 'X-Response-Method']
}));
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

// In-memory query cache store for HTTP QUERY endpoint
const queryCache = new Map();

// Helper function to clear query cache on database modifications
const clearCache = () => {
  queryCache.clear();
  console.log('TaskFlow Query Cache successfully invalidated.');
};

// Generate order-independent SHA-256 hash for cache key
const generateCacheKey = (body) => {
  const sortedKeys = Object.keys(body).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = body[key];
  }
  const serialized = JSON.stringify(sortedObj);
  return crypto.createHash('sha256').update(serialized).digest('hex');
};

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
    clearCache();
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
    clearCache();
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
    clearCache();
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
    clearCache();
    res.json({ message: 'Team member removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error removing member' });
  }
});

// Endpoint supporting the HTTP QUERY method (RFC 10008) for complex, safe, and cacheable task filtering.
// We support both native QUERY method and a POST fallback for maximum client compatibility.
app.all('/api/tasks/query', async (req, res) => {
  if (req.method !== 'QUERY' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use QUERY (or POST fallback)' });
  }

  const startTime = process.hrtime.bigint();

  try {
    const cacheKey = generateCacheKey(req.body);
    
    // Check cache
    if (queryCache.has(cacheKey)) {
      const cachedData = queryCache.get(cacheKey);
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1000000;
      
      res.setHeader('X-Response-Method', req.method);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${latencyMs.toFixed(3)}ms`);
      return res.json(cachedData);
    }

    const { projectId, status, priority, assignedMemberId, searchTerm } = req.body;
    let queryText = `
      SELECT 
        id::text, 
        project_id AS "projectId", 
        text, 
        description, 
        priority, 
        status, 
        to_char(due_date, 'YYYY-MM-DD') AS "dueDate", 
        assigned_member_id AS "assignedMemberId", 
        completed,
        completed_at AS "completedAt"
      FROM tasks 
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 1;

    if (projectId && projectId !== 'All') {
      queryText += ` AND project_id = $${paramCount++}`;
      queryParams.push(Number(projectId));
    }
    if (status && status !== 'All') {
      queryText += ` AND status = $${paramCount++}`;
      queryParams.push(status);
    }
    if (priority && priority !== 'All') {
      queryText += ` AND priority = $${paramCount++}`;
      queryParams.push(priority);
    }
    if (assignedMemberId && assignedMemberId !== 'All') {
      if (assignedMemberId === 'Unassigned') {
        queryText += ` AND assigned_member_id IS NULL`;
      } else {
        queryText += ` AND assigned_member_id = $${paramCount++}`;
        queryParams.push(Number(assignedMemberId));
      }
    }
    if (searchTerm && searchTerm.trim() !== '') {
      queryText += ` AND (text ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      paramCount++;
      queryParams.push(`%${searchTerm.trim()}%`);
    }

    queryText += ` ORDER BY created_at ASC`;

    const result = await pool.query(queryText, queryParams);
    
    // Store in cache
    queryCache.set(cacheKey, result.rows);

    const endTime = process.hrtime.bigint();
    const latencyMs = Number(endTime - startTime) / 1000000;

    res.setHeader('X-Response-Method', req.method);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${latencyMs.toFixed(3)}ms`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error querying tasks' });
  }
});

// Diagnostic endpoint to debug and inspect the in-memory query cache entries
app.get('/api/cache-debug', (req, res) => {
  const cacheData = [];
  queryCache.forEach((value, key) => {
    cacheData.push({
      cacheKey: key,
      cachedRecordCount: value.length,
      records: value
    });
  });
  res.json({
    totalCachedQueries: queryCache.size,
    cacheEntries: cacheData
  });
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
        completed,
        completed_at AS "completedAt"
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
      `INSERT INTO tasks (id, project_id, text, description, priority, status, due_date, assigned_member_id, completed, completed_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NULL) 
       RETURNING id::text, project_id AS "projectId", text, description, priority, status, to_char(due_date, 'YYYY-MM-DD') AS "dueDate", assigned_member_id AS "assignedMemberId", completed, completed_at AS "completedAt"`,
      [id, projectId, text.trim(), description, priority || 'Medium', status || 'Pending', formattedDueDate, formattedAssignedMemberId]
    );
    clearCache();
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
    let completedAtVal = task.completed_at;
    if (completedVal) {
      if (!task.completed) {
        completedAtVal = new Date();
      }
    } else {
      completedAtVal = null;
    }

    const textVal = text !== undefined ? text.trim() : task.text;
    const descriptionVal = description !== undefined ? description : task.description;
    const priorityVal = priority !== undefined ? priority : task.priority;
    const statusVal = status !== undefined ? status : task.status;

    const result = await pool.query(
      `UPDATE tasks 
       SET text = $1, description = $2, priority = $3, status = $4, due_date = $5, assigned_member_id = $6, completed = $7, completed_at = $8 
       WHERE id = $9 
       RETURNING id::text, project_id AS "projectId", text, description, priority, status, to_char(due_date, 'YYYY-MM-DD') AS "dueDate", assigned_member_id AS "assignedMemberId", completed, completed_at AS "completedAt"`,
      [textVal, descriptionVal, priorityVal, statusVal, formattedDueDate, formattedAssignedMemberId, completedVal, completedAtVal, id]
    );
    
    clearCache();
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
    clearCache();
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error deleting task' });
  }
});

app.listen(PORT, () => {
  console.log(`TaskMatrix API Server is running on port ${PORT}`);
});
