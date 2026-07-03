import test from 'node:test';
import assert from 'node:assert';

/**
 * Pure function representing the Task validation business logic:
 * 1. Title must not be empty.
 * 2. High priority tasks must have a due date.
 * 3. Due dates cannot be set in the past.
 */
function validateTask(text, priority, dueDate) {
  if (!text || !text.trim()) {
    return { valid: false, error: 'Title is required' };
  }
  if (priority === 'High' && !dueDate) {
    return { valid: false, error: 'High priority tasks must have a due date' };
  }
  if (dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = dueDate.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);

    if (selectedDate < today) {
      return { valid: false, error: 'Due date cannot be in the past' };
    }
  }
  return { valid: true };
}

// ==================== UNIT TESTS ====================

test('Task Validation - Empty Title fails validation', () => {
  const res = validateTask('   ', 'Medium', '');
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.error, 'Title is required');
});

test('Task Validation - High Priority without due date fails validation', () => {
  const res = validateTask('Complete API routes', 'High', '');
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.error, 'High priority tasks must have a due date');
});

test('Task Validation - Past due date fails validation', () => {
  const res = validateTask('Complete design spec', 'Medium', '2020-05-15');
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.error, 'Due date cannot be in the past');
});

test('Task Validation - Future due date passes validation', () => {
  const res = validateTask('Plan project sprint', 'High', '2030-12-31');
  assert.strictEqual(res.valid, true);
});

test('Task Validation - Today due date passes validation', () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const res = validateTask('Verify server build', 'Medium', todayStr);
  assert.strictEqual(res.valid, true);
});
