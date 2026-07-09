import test from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

test('API Backend - Check if Server is running & Database is connected', async () => {
  let res;
  try {
    res = await fetch(`${BASE_URL}/projects`);
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
  const testProjectName = `__TEST_PROJ_${Date.now()}__`;
  const testTaskId = Date.now();

  let resHealth;
  try {
    resHealth = await fetch(`${BASE_URL}/projects`);
  } catch (err) {
    return;
  }
  if (resHealth.status !== 200) {
    return;
  }
  
  const createProjRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: testProjectName })
  });
  assert.strictEqual(createProjRes.status, 201);
  const projResponse = await createProjRes.json();
  assert.strictEqual(projResponse.message, 'Project added successfully');
  const projData = projResponse.data;
  assert.ok(projData && projData.id);

  const getProjsRes = await fetch(`${BASE_URL}/projects`);
  const projects = await getProjsRes.json();
  assert.ok(projects.some(p => p.name === testProjectName));

  const createTaskRes = await fetch(`${BASE_URL}/tasks`, {
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

  const getTasksRes = await fetch(`${BASE_URL}/tasks`);
  const tasks = await getTasksRes.json();
  const foundTask = tasks.find(t => Number(t.id) === testTaskId);
  assert.ok(foundTask);
  assert.strictEqual(Number(foundTask.projectId), Number(projData.id));

  const deleteProjRes = await fetch(`${BASE_URL}/projects/${projData.id}`, {
    method: 'DELETE'
  });
  assert.strictEqual(deleteProjRes.status, 200);

  const getProjsPostRes = await fetch(`${BASE_URL}/projects`);
  const projectsPost = await getProjsPostRes.json();
  assert.ok(!projectsPost.some(p => p.name === testProjectName));
});

test('API Backend - Query Tasks using HTTP QUERY method (RFC 10008)', async () => {
  const testProjectName = `__QUERY_TEST_PROJ_${Date.now()}__`;
  const task1Id = Date.now();
  const task2Id = Date.now() + 1;

  let resHealth;
  try {
    resHealth = await fetch(`${BASE_URL}/projects`);
  } catch (err) {
    return;
  }
  if (resHealth.status !== 200) {
    return;
  }

  // 1. Create a project
  const createProjRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: testProjectName })
  });
  const projResponse = await createProjRes.json();
  const projData = projResponse.data;

  // 2. Create Task 1 (Pending)
  await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: task1Id,
      projectId: projData.id,
      text: 'Query Task 1',
      description: 'Pending task',
      priority: 'Medium',
      status: 'Pending'
    })
  });

  // 3. Create Task 2 (In Progress)
  await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: task2Id,
      projectId: projData.id,
      text: 'Query Task 2',
      description: 'In progress task',
      priority: 'High',
      status: 'In Progress'
    })
  });

  // 4. Query using HTTP QUERY method - First request (MISS)
  const queryRes1 = await fetch(`${BASE_URL}/tasks/query`, {
    method: 'QUERY',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: projData.id,
      status: 'In Progress'
    })
  });

  assert.strictEqual(queryRes1.status, 200);
  assert.strictEqual(queryRes1.headers.get('x-response-method'), 'QUERY');
  assert.strictEqual(queryRes1.headers.get('x-cache'), 'MISS');
  assert.ok(queryRes1.headers.get('x-response-time'));
  
  const queryData1 = await queryRes1.json();
  assert.strictEqual(queryData1.length, 1);
  assert.strictEqual(Number(queryData1[0].id), task2Id);

  // 5. Run identical query - Second request (HIT)
  const queryRes2 = await fetch(`${BASE_URL}/tasks/query`, {
    method: 'QUERY',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: projData.id,
      status: 'In Progress'
    })
  });

  assert.strictEqual(queryRes2.status, 200);
  assert.strictEqual(queryRes2.headers.get('x-cache'), 'HIT');

  // 6. Clean up (deleting the project should trigger write events and invalidate/clear the cache)
  const deleteRes = await fetch(`${BASE_URL}/projects/${projData.id}`, {
    method: 'DELETE'
  });
  assert.strictEqual(deleteRes.status, 200);

  // 7. Run query again - Third request (MISS because write event cleared cache)
  const queryRes3 = await fetch(`${BASE_URL}/tasks/query`, {
    method: 'QUERY',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: projData.id,
      status: 'In Progress'
    })
  });

  assert.strictEqual(queryRes3.status, 200);
  assert.strictEqual(queryRes3.headers.get('x-cache'), 'MISS');
  const queryData3 = await queryRes3.json();
  assert.strictEqual(queryData3.length, 0); // project deleted, so tasks deleted
});
