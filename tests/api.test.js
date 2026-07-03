import test from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

/**
 * API integration tests.
 * Note: These tests require the backend server to be running on http://localhost:5000.
 */

test('API Backend - Check if Server is running & Database is connected', async () => {
  let res;
  try {
    res = await fetch(`${BASE_URL}/projects`);
  } catch (err) {
    throw new Error('Backend server is not running on http://localhost:5000. Please start the server first using: npm run server');
  }

  if (res.status === 500) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(`Backend server is running, but database queries failed (HTTP 500). Please check if PostgreSQL is running and credentials in backend/.env are correct. Detail: ${JSON.stringify(errorBody)}`);
  }

  assert.strictEqual(res.status, 200);
  const projects = await res.json();
  assert.ok(Array.isArray(projects));
});

test('API Backend - Create, Fetch, and Delete a Test Project & Task', async () => {
  const testProjectName = `__TEST_PROJ_${Date.now()}__`;
  const testTaskId = Date.now();

  let resHealth;
  try {
    resHealth = await fetch(`${BASE_URL}/projects`);
  } catch (err) {
    return; // Skip integration tests silently if server is not running
  }
  if (resHealth.status !== 200) {
    return; // Skip integration tests if database is unreachable
  }

  // 1. Create a temporary project
  const createProjRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: testProjectName })
  });
  assert.strictEqual(createProjRes.status, 201);
  const projData = await createProjRes.json();
  assert.strictEqual(projData.message, 'Project added successfully');

  // 2. Verify project exists in GET list
  const getProjsRes = await fetch(`${BASE_URL}/projects`);
  const projects = await getProjsRes.json();
  assert.ok(projects.includes(testProjectName));

  // 3. Create a task under that project
  const createTaskRes = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: testTaskId,
      project: testProjectName,
      text: 'Temporary Integration Test Task',
      description: 'API test coverage',
      priority: 'Medium',
      status: 'Pending'
    })
  });
  assert.strictEqual(createTaskRes.status, 201);
  const taskData = await createTaskRes.json();
  assert.strictEqual(taskData.text, 'Temporary Integration Test Task');

  // 4. Verify task exists in GET list
  const getTasksRes = await fetch(`${BASE_URL}/tasks`);
  const tasks = await getTasksRes.json();
  const foundTask = tasks.find(t => Number(t.id) === testTaskId);
  assert.ok(foundTask);
  assert.strictEqual(foundTask.project, testProjectName);

  // 5. Delete the temporary project (cascades and deletes the task too!)
  const deleteProjRes = await fetch(`${BASE_URL}/projects/${encodeURIComponent(testProjectName)}`, {
    method: 'DELETE'
  });
  assert.strictEqual(deleteProjRes.status, 200);

  // 6. Verify project is removed
  const getProjsPostRes = await fetch(`${BASE_URL}/projects`);
  const projectsPost = await getProjsPostRes.json();
  assert.ok(!projectsPost.includes(testProjectName));
});
