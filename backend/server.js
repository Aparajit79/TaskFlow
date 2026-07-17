const express = require('express');
const crypto = require('crypto');
const { Pool } = require('pg');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-secret-super-key-9988';

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  exposedHeaders: ['X-Cache', 'X-Response-Time', 'X-Response-Method']
}));
app.use(express.json());
app.use(cookieParser());

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

// Middleware to verify JWT token in HttpOnly cookies
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Please log in.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, name, role }
    next();
  } catch (err) {
    res.clearCookie('auth_token');
    return res.status(403).json({ error: 'Session expired. Please log in again.' });
  }
};

// 1Auth Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { type, email, username, password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    let user;
    if (type === 'admin') {
      if (!email) return res.status(400).json({ error: 'Email is required' });
      const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
      if (userRes.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      user = userRes.rows[0];
    } else {
      if (!username) return res.status(400).json({ error: 'Username is required' });
      const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [username.trim()]);
      if (userRes.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      user = userRes.rows[0];
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: false, 
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

//Logout Endpoint
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Logged out successfully' });
});

//Get Members Users 
app.get('/api/users/members', async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, username FROM users WHERE role = 'member' ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching team users' });
  }
});

// 4. Get Available Users for Project Assignment
app.get('/api/users/available', authenticateJWT, async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }
  try {
    const result = await pool.query(`
      SELECT id, name, username 
      FROM users 
      WHERE role = 'member' 
        AND id NOT IN (
          SELECT user_id 
          FROM members 
          WHERE project_id = $1
        )
      ORDER BY name ASC
    `, [Number(projectId)]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching available users' });
  }
});

// 5. Assign User to Project
app.post('/api/members/assign', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can assign members to projects' });
  }

  const { projectId, userId, role } = req.body;
  if (!projectId || !userId || !role) {
    return res.status(400).json({ error: 'projectId, userId, and role are required' });
  }

  try {
    const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [Number(userId)]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const name = userRes.rows[0].name;
    const avatar = name.trim().charAt(0).toUpperCase();

    const result = await pool.query(
      `INSERT INTO members (project_id, user_id, name, role, avatar) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (project_id, user_id) 
       DO UPDATE SET role = EXCLUDED.role 
       RETURNING id, project_id AS "projectId", name, role, avatar`,
      [Number(projectId), Number(userId), name, role, avatar]
    );

    clearCache();
    res.status(201).json({ message: 'Member assigned successfully', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error assigning user' });
  }
});

// 6. Check Current Auth Status
app.get('/api/auth/me', authenticateJWT, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/projects', authenticateJWT, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query('SELECT id, name FROM projects ORDER BY created_at ASC');
    } else {
      result = await pool.query(`
        SELECT p.id, p.name 
        FROM projects p
        JOIN members m ON m.project_id = p.id
        WHERE m.user_id = $1
        ORDER BY p.created_at ASC
      `, [req.user.id]);
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching projects' });
  }
});

app.post('/api/projects', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create projects' });
  }
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

app.delete('/api/projects/:id', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete projects' });
  }
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

app.get('/api/members', authenticateJWT, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query('SELECT id, project_id AS "projectId", user_id AS "userId", name, role, avatar FROM members ORDER BY created_at ASC');
    } else {
      // Members can see all members in projects they belong to
      result = await pool.query(`
        SELECT id, project_id AS "projectId", user_id AS "userId", name, role, avatar 
        FROM members 
        WHERE project_id IN (
          SELECT project_id FROM members WHERE user_id = $1
        )
        ORDER BY created_at ASC
      `, [req.user.id]);
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching team members' });
  }
});

app.post('/api/members', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can add members directly' });
  }
  const { projectId, name, role } = req.body;
  if (!projectId || !name || !role) {
    return res.status(400).json({ error: 'ProjectId, name, and role are required' });
  }

  const avatar = name.trim().charAt(0).toUpperCase();

  try {
    // Generate a unique username from name
    const baseUsername = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    let username = baseUsername;
    let counter = 1;
    // Check if username exists
    while (true) {
      const checkRes = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
      if (checkRes.rows.length === 0) break;
      username = `${baseUsername}_${counter++}`;
    }

    // Hash default password
    const passwordHash = await bcrypt.hash('member123', 10);
    const email = `${username}@taskflow.com`;

    // Start a transaction to ensure atomic inserts
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Insert user
      const userResult = await client.query(
        'INSERT INTO users (name, email, username, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [name.trim(), email, username, passwordHash, 'member']
      );
      const userId = userResult.rows[0].id;

      // 2. Insert member
      const memberResult = await client.query(
        'INSERT INTO members (project_id, user_id, name, role, avatar) VALUES ($1, $2, $3, $4, $5) RETURNING id, project_id AS "projectId", name, role, avatar',
        [Number(projectId), userId, name.trim(), role, avatar]
      );

      await client.query('COMMIT');
      clearCache();
      res.status(201).json({ message: 'Team member added successfully', data: memberResult.rows[0] });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error adding team member' });
  }
});

app.delete('/api/members/:id', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can remove members' });
  }
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
app.all('/api/tasks/query', authenticateJWT, async (req, res) => {
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
        completed_at AS "completedAt",
        sprint_id AS "sprintId"
      FROM tasks 
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 1;

    // Enforce role workspace boundaries
    if (req.user.role !== 'admin') {
      const userProjects = await pool.query('SELECT project_id FROM members WHERE user_id = $1', [req.user.id]);
      const projectIds = userProjects.rows.map(row => Number(row.project_id));

      if (projectId && projectId !== 'All') {
        if (!projectIds.includes(Number(projectId))) {
          return res.status(403).json({ error: 'Access Denied: You are not a member of this project' });
        }
        queryText += ` AND project_id = $${paramCount++}`;
        queryParams.push(Number(projectId));
      } else {
        if (projectIds.length === 0) {
          queryText += ` AND 1=0`;
        } else {
          queryText += ` AND project_id = ANY($${paramCount++})`;
          queryParams.push(projectIds);
        }
      }
    } else {
      if (projectId && projectId !== 'All') {
        queryText += ` AND project_id = $${paramCount++}`;
        queryParams.push(Number(projectId));
      }
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
app.get('/api/cache-debug', authenticateJWT, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can inspect query caches' });
  }
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

app.get('/api/tasks', authenticateJWT, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(`
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
          completed_at AS "completedAt",
          sprint_id AS "sprintId"
        FROM tasks 
        ORDER BY created_at ASC
      `);
    } else {
      result = await pool.query(`
        SELECT 
          t.id::text, 
          t.project_id AS "projectId", 
          t.text, 
          t.description, 
          t.priority, 
          t.status, 
          to_char(t.due_date, 'YYYY-MM-DD') AS "dueDate", 
          t.assigned_member_id AS "assignedMemberId", 
          t.completed,
          t.completed_at AS "completedAt",
          t.sprint_id AS "sprintId"
        FROM tasks t
        WHERE t.project_id IN (
          SELECT m.project_id FROM members m WHERE m.user_id = $1
        )
        ORDER BY t.created_at ASC
      `, [req.user.id]);
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching tasks' });
  }
});

app.post('/api/tasks', authenticateJWT, async (req, res) => {
  const { id, projectId, text, description, priority, status, dueDate, assignedMemberId } = req.body;
  if (!id || !projectId || !text) {
    return res.status(400).json({ error: 'Task ID, projectId, and title are required' });
  }

  // Scoping check for member creation
  if (req.user.role !== 'admin') {
    const memberCheck = await pool.query('SELECT id FROM members WHERE project_id = $1 AND user_id = $2', [Number(projectId), req.user.id]);
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access Denied: You are not a member of this project' });
    }
    const memberId = memberCheck.rows[0].id;
    // Standard members can only create tasks assigned to themselves or unassigned
    if (assignedMemberId !== undefined && assignedMemberId !== null && Number(assignedMemberId) !== memberId) {
      return res.status(403).json({ error: 'Access Denied: You cannot assign new tasks to other members' });
    }
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

app.put('/api/tasks/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { text, description, priority, status, dueDate, assignedMemberId, completed } = req.body;

  try {
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = taskResult.rows[0];

    // Scoping check for member edit and drag
    if (req.user.role !== 'admin') {
      const memberRes = await pool.query('SELECT id FROM members WHERE project_id = $1 AND user_id = $2', [task.project_id, req.user.id]);
      if (memberRes.rows.length === 0) {
        return res.status(403).json({ error: 'Access Denied: You are not a member of this project' });
      }
      const memberId = memberRes.rows[0].id;
      
      // Standard members can only update tasks assigned directly to them
      if (task.assigned_member_id !== memberId) {
        return res.status(403).json({ error: 'Access Denied: You can only edit or drag tasks assigned to you' });
      }

      // Enforce they cannot reassign the task to someone else
      if (assignedMemberId !== undefined && assignedMemberId !== null && Number(assignedMemberId) !== memberId) {
        return res.status(403).json({ error: 'Access Denied: You cannot reassign your tasks to other members' });
      }
    }

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

app.delete('/api/tasks/:id', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete tasks' });
  }
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

// ==================== Scrum Module Routes ====================

app.get('/api/projects/:projectId/sprints', authenticateJWT, async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, project_id AS "projectId", sprint_number AS "sprintNumber", goal, duration_weeks AS "durationWeeks", status, start_date AS "startDate", end_date AS "endDate" FROM sprints WHERE project_id = $1 ORDER BY sprint_number DESC',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching sprints' });
  }
});

app.post('/api/projects/:projectId/sprints', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create sprints' });
  }
  const { projectId } = req.params;
  const { durationWeeks = 2, goal = '' } = req.body;
  try {
    const maxRes = await pool.query('SELECT COALESCE(MAX(sprint_number), 0) AS max FROM sprints WHERE project_id = $1', [projectId]);
    const nextNumber = maxRes.rows[0].max + 1;
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (durationWeeks * 7));

    const result = await pool.query(
      'INSERT INTO sprints (project_id, sprint_number, goal, duration_weeks, status, start_date, end_date) VALUES ($1, $2, $3, $4, \'active\', $5, $6) RETURNING id, project_id AS "projectId", sprint_number AS "sprintNumber", goal, duration_weeks AS "durationWeeks", status, start_date AS "startDate", end_date AS "endDate"',
      [projectId, nextNumber, goal, durationWeeks, startDate, endDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error creating sprint' });
  }
});

app.put('/api/sprints/:sprintId/complete', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can complete sprints' });
  }
  const { sprintId } = req.params;
  try {
    const sprintRes = await pool.query(
      'UPDATE sprints SET status = \'completed\', end_date = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, status',
      [sprintId]
    );
    if (sprintRes.rowCount === 0) {
      return res.status(404).json({ error: 'Sprint not found' });
    }
    await pool.query(
      'UPDATE tasks SET sprint_id = NULL WHERE sprint_id = $1 AND completed = FALSE',
      [sprintId]
    );
    clearCache();
    res.json(sprintRes.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error completing sprint' });
  }
});

app.put('/api/tasks/:id/sprint', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can modify sprint task assignments' });
  }
  const { id } = req.params;
  const { sprintId } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET sprint_id = $1 WHERE id = $2 RETURNING id::text, project_id AS "projectId", text, sprint_id AS "sprintId", completed',
      [sprintId, id]
    );
    clearCache();
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error assigning task to sprint' });
  }
});

app.post('/api/sprints/:sprintId/meetings', authenticateJWT, async (req, res) => {
  const { sprintId } = req.params;
  const { yesterdayDone, todayPlan, blockers = '' } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO scrum_meetings (sprint_id, user_id, yesterday_done, today_plan, blockers) VALUES ($1, $2, $3, $4, $5) RETURNING id, sprint_id AS "sprintId", user_id AS "userId", yesterday_done AS "yesterdayDone", today_plan AS "todayPlan", blockers, created_at AS "createdAt"',
      [sprintId, req.user.id, yesterdayDone, todayPlan, blockers]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error logging daily standup' });
  }
});

app.get('/api/sprints/:sprintId/meetings', authenticateJWT, async (req, res) => {
  const { sprintId } = req.params;
  try {
    const result = await pool.query(
      `SELECT sm.id, sm.sprint_id AS "sprintId", sm.user_id AS "userId", u.name AS "userName", sm.yesterday_done AS "yesterdayDone", sm.today_plan AS "todayPlan", sm.blockers, sm.created_at AS "createdAt" 
       FROM scrum_meetings sm
       JOIN users u ON sm.user_id = u.id
       WHERE sm.sprint_id = $1
       ORDER BY sm.created_at DESC`,
      [sprintId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching standup logs' });
  }
});

app.post('/api/sprints/:sprintId/retro', authenticateJWT, async (req, res) => {
  const { sprintId } = req.params;
  const { category, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO retro_items (sprint_id, user_id, category, content) VALUES ($1, $2, $3, $4) RETURNING id, sprint_id AS "sprintId", user_id AS "userId", category, content, votes, created_at AS "createdAt"',
      [sprintId, req.user.id, category, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error creating retro item' });
  }
});

app.get('/api/sprints/:sprintId/retro', authenticateJWT, async (req, res) => {
  const { sprintId } = req.params;
  try {
    const result = await pool.query(
      `SELECT ri.id, ri.sprint_id AS "sprintId", ri.user_id AS "userId", u.name AS "userName", ri.category, ri.content, ri.votes, ri.created_at AS "createdAt"
       FROM retro_items ri
       JOIN users u ON ri.user_id = u.id
       WHERE ri.sprint_id = $1
       ORDER BY ri.votes DESC, ri.created_at DESC`,
      [sprintId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching retro items' });
  }
});

app.post('/api/retro/:itemId/vote', authenticateJWT, async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const checkRes = await client.query(
      'SELECT id FROM retro_votes WHERE retro_item_id = $1 AND user_id = $2',
      [itemId, userId]
    );

    let updatedVotes;
    if (checkRes.rows.length > 0) {
      await client.query(
        'DELETE FROM retro_votes WHERE retro_item_id = $1 AND user_id = $2',
        [itemId, userId]
      );
      const updateRes = await client.query(
        'UPDATE retro_items SET votes = GREATEST(votes - 1, 0) WHERE id = $1 RETURNING id, votes',
        [itemId]
      );
      updatedVotes = updateRes.rows[0].votes;
    } else {
      await client.query(
        'INSERT INTO retro_votes (retro_item_id, user_id) VALUES ($1, $2)',
        [itemId, userId]
      );
      const updateRes = await client.query(
        'UPDATE retro_items SET votes = votes + 1 WHERE id = $1 RETURNING id, votes',
        [itemId]
      );
      updatedVotes = updateRes.rows[0].votes;
    }

    await client.query('COMMIT');
    res.json({ id: Number(itemId), votes: updatedVotes });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Database error handling retro item vote' });
  } finally {
    client.release();
  }
});

// ==================== Direct Messaging Routes ====================

app.post('/api/messages', authenticateJWT, async (req, res) => {
  const { receiverId, messageText } = req.body;
  const senderId = req.user.id;
  if (!receiverId || !messageText || !messageText.trim()) {
    return res.status(400).json({ error: 'Receiver ID and message text are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO direct_messages (sender_id, receiver_id, message_text) VALUES ($1, $2, $3) RETURNING id, sender_id AS "senderId", receiver_id AS "receiverId", message_text AS "messageText", created_at AS "createdAt"',
      [senderId, Number(receiverId), messageText.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error sending message' });
  }
});

app.get('/api/messages/:contactId', authenticateJWT, async (req, res) => {
  const { contactId } = req.params;
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT id, sender_id AS "senderId", receiver_id AS "receiverId", message_text AS "messageText", created_at AS "createdAt"
       FROM direct_messages
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [userId, Number(contactId)]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching messages' });
  }
});

app.get('/api/messages-contacts', authenticateJWT, async (req, res) => {
  const userId = req.user.id;
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(
        'SELECT id, name, role FROM users WHERE id != $1 ORDER BY name ASC',
        [userId]
      );
    } else {
      result = await pool.query(
        'SELECT id, name, role FROM users WHERE role = \'admin\' AND id != $1 ORDER BY name ASC',
        [userId]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching message contacts' });
  }
});

app.listen(PORT, () => {
  console.log(`TaskMatrix API Server is running on port ${PORT}`);
});

