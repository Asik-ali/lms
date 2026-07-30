import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCourseAccessSelection, serializeCourseAccess, getCourseAccessLabel } from './studentCourseAccess.js';

test('normalizes comma-separated course access values into a clean array', () => {
  assert.deepEqual(normalizeCourseAccessSelection('React Fundamentals, Node.js Advanced, '), ['React Fundamentals', 'Node.js Advanced']);
});

test('serializes selected courses into a comma-separated value for storage', () => {
  assert.equal(serializeCourseAccess(['React Fundamentals', 'Node.js Advanced']), 'React Fundamentals, Node.js Advanced');
});

test('formats empty selections as a dash label', () => {
  assert.equal(getCourseAccessLabel(''), '-');
});
