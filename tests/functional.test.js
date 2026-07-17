import test from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function getAuthCookie(loginPayload) {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginPayload)
    });
    const setCookie = res.headers.get('set-cookie');
    return setCookie ? setCookie.split(';')[0] : '';
  } catch (err) {
    console.error('Failed to authenticate in helper:', err.message);
    return '';
  }
}

// testcase 1. AUTHENTICATION FAILURES TESTS

test('Auth Failure - Invalid password returns 401 Unauthorized', async () => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'admin',
      email: 'admin@taskflow.com',
      password: 'wrong_password'
    })
  });
  
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.error, 'Invalid credentials');
});

test('Auth Failure - Missing password returns 400 Bad Request', async () => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'admin',
      email: 'admin@taskflow.com'
     
    })
  });
  
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.error, 'Password is required');
});

// Test case 2. ROLE BASED ACCESS CONTROL TESTS


test('RBAC - Member role cannot create a project (returns 403 Forbidden)', async () => {
  const memberCookie = await getAuthCookie({
    type: 'member',
    username: 'john_doe',
    password: 'member123'
  });
  
  assert.ok(memberCookie, 'Member login should succeed and return a cookie');

  const res = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': memberCookie
    },
    body: JSON.stringify({ name: 'Forbidden Member Project' })
  });

  assert.strictEqual(res.status, 403);
  const data = await res.json();
  assert.strictEqual(data.error, 'Only admins can create projects');
});

test('RBAC - Member role cannot delete a project (returns 403 Forbidden)', async () => {
  const memberCookie = await getAuthCookie({
    type: 'member',
    username: 'john_doe',
    password: 'member123'
  });

  // Attempt to delete a project with ID 1
  const res = await fetch(`${BASE_URL}/projects/1`, {
    method: 'DELETE',
    headers: { 'Cookie': memberCookie }
  });

  assert.strictEqual(res.status, 403);
  const data = await res.json();
  assert.strictEqual(data.error, 'Only admins can delete projects');
});


//TASK CREATION VALIDATION no title

test('Validation - Missing text/title field on task creation returns 400 Bad Request', async () => {
  const adminCookie = await getAuthCookie({
    type: 'admin',
    email: 'admin@taskflow.com',
    password: 'admin123'
  });
  
  assert.ok(adminCookie, 'Admin login should succeed');

  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({
      id: 88888,
      projectId: 1
      // no tietle
    })
  });

  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.error, 'Task ID, projectId, and title are required');
});


//TASK CRETE UPDATE & COMPLETION WORKFLOW TESTS

test('Workflow - Create, Update, and Complete a Task', async () => {
  const adminCookie = await getAuthCookie({
    type: 'admin',
    email: 'admin@taskflow.com',
    password: 'admin123'
  });

  const tempTaskId = 99991;
  const testProjectName = `__FUNC_TEST_PROJ_${Date.now()}__`;
  //login
  const createProjRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({ name: testProjectName })
  });
  assert.strictEqual(createProjRes.status, 201);
  const projResponse = await createProjRes.json();
  const tempProjectId = projResponse.data.id;
  assert.ok(tempProjectId, 'Created project should return an ID');

  //createTask
  const createRes = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({
      id: tempTaskId,
      projectId: tempProjectId,
      text: 'Functional Test Task',
      priority: 'Low',
      status: 'Pending'
    })
  });
  assert.strictEqual(createRes.status, 201);

  //UpdateTask

  const updateRes = await fetch(`${BASE_URL}/tasks/${tempTaskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({
      text: 'Functional Test Task (Updated)',
      priority: 'Low',
      status: 'Completed',
      completed: true
    })
  });
  assert.strictEqual(updateRes.status, 200);

  //VerifyCompleted
  const getTasksRes = await fetch(`${BASE_URL}/tasks`, {
    headers: { 'Cookie': adminCookie }
  });
  const tasks = await getTasksRes.json();
  const updatedTask = tasks.find(t => Number(t.id) === tempTaskId);
  
  assert.ok(updatedTask, 'Updated task should exist in the list');
  assert.strictEqual(updatedTask.status, 'Completed');
  assert.strictEqual(updatedTask.completed, true);
  assert.ok(updatedTask.completedAt, 'completedAt timestamp should be recorded in DB');

  //deleting the created project
  const deleteRes = await fetch(`${BASE_URL}/projects/${tempProjectId}`, {
    method: 'DELETE',
    headers: { 'Cookie': adminCookie }
  });
  assert.strictEqual(deleteRes.status, 200);
});


//Teast5 SESSION (LOGOUT)


test('Logout - Clears auth_token cookie', async () => {
  const adminCookie = await getAuthCookie({
    type: 'admin',
    email: 'admin@taskflow.com',
    password: 'admin123'
  });

  const res = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Cookie': adminCookie }
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.message, 'Logged out successfully');

  const setCookie = res.headers.get('set-cookie');
  assert.ok(setCookie, 'Logout must send a Set-Cookie header');
  assert.ok(setCookie.includes('auth_token='), 'Set-Cookie must clear the auth_token cookie');
});
