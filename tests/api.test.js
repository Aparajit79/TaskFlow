import test from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';
let adminCookie = '';

async function getAdminCookie() {
  if (adminCookie) return adminCookie;
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'admin',
        email: 'admin@taskflow.com',
        password: 'admin123'
      })
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      adminCookie = setCookie.split(';')[0];
    }
  } catch (err) {
    console.error('Error logging in admin for tests:', err);
  }
  return adminCookie;
}

async function authenticatedFetch(url, options = {}) {
  const cookie = await getAdminCookie();
  const headers = {
    ...options.headers,
  };
  if (cookie) {
    headers['Cookie'] = cookie;
  }
  return fetch(url, {
    ...options,
    headers
  });
}

test('API Backend - Check if Server is running & Database is connected', async () => {
  let res;
  try {
    res = await authenticatedFetch(`${BASE_URL}/projects`);
  } catch (err) {
    throw new Error('Backend server is not running on http://localhost:5000. Please start the server first using: npm run server');
  }

  if (res.status === 500) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(`Backend server is running, but database queries failed (HTTP 500). Detail: ${JSON.stringify(errorBody)}`);
  }

  assert.strictEqual(res.status, 200);
  const projects = await res.json();
  assert.ok(Array.isArray(projects));
});

test('API Backend - Create, Fetch, and Delete a Test Project & Task', async () => {
  const testProjectName = `Proj ${Date.now().toString().slice(-10)}`;
  const testTaskId = Date.now();

  let resHealth;
  try {
    resHealth = await authenticatedFetch(`${BASE_URL}/projects`);
  } catch (err) {
    return;
  }
  if (resHealth.status !== 200) {
    return;
  }
  
  const createProjRes = await authenticatedFetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: testProjectName })
  });
  assert.strictEqual(createProjRes.status, 201);
  const projResponse = await createProjRes.json();
  assert.strictEqual(projResponse.message, 'Project added successfully');
  const projData = projResponse.data;
  assert.ok(projData && projData.id);

  const getProjsRes = await authenticatedFetch(`${BASE_URL}/projects`);
  const projects = await getProjsRes.json();
  assert.ok(projects.some(p => p.name === testProjectName));

  const createTaskRes = await authenticatedFetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: testTaskId,
      projectId: projData.id,
      text: 'Temporary Integration Test Task',
      description: 'API test coverage',
      priority: 'Medium',
      status: 'Pending'
    })
  });
  assert.strictEqual(createTaskRes.status, 201);
  const taskData = await createTaskRes.json();
  assert.strictEqual(taskData.text, 'Temporary Integration Test Task');

  const getTasksRes = await authenticatedFetch(`${BASE_URL}/tasks`);
  const tasks = await getTasksRes.json();
  const foundTask = tasks.find(t => Number(t.id) === testTaskId);
  assert.ok(foundTask);
  assert.strictEqual(Number(foundTask.projectId), Number(projData.id));

  const deleteProjRes = await authenticatedFetch(`${BASE_URL}/projects/${projData.id}`, {
    method: 'DELETE'
  });
  assert.strictEqual(deleteProjRes.status, 200);

  const getProjsPostRes = await authenticatedFetch(`${BASE_URL}/projects`);
  const projectsPost = await getProjsPostRes.json();
  assert.ok(!projectsPost.some(p => p.name === testProjectName));
});

