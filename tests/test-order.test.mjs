import test from 'node:test';
import assert from 'node:assert/strict';
import { sortTests } from '../src/data/testOrder.js';

test('sectional tests sort numerically, group language variants, then show full tests', () => {
  const names = ['Polity Full Test (Tamil)', 'Polity Sectional Test II (Tamil)', 'Polity Sectional Test II', 'Polity Sectional Test I (Tamil)', 'Polity Full Test', 'Polity Sectional Test I'];
  const rows = names.map((name, id) => ({ id, name, language: name.includes('(Tamil)') ? 'Tamil' : 'English / Tamil' }));
  assert.deepEqual(sortTests(rows).map(row => row.name), [names[5], names[3], names[2], names[1], names[4], names[0]]);
  assert.equal(rows[0].name, names[0]);
  assert.deepEqual(sortTests([{ name: 'Test 10' }, { name: 'Test 2' }]).map(row => row.name), ['Test 2', 'Test 10']);
});


test('Tamil full exams and parenthesized full exams appear after topic tests', () => {
  const fullTamil = '\u0bae\u0bc1\u0bb4\u0bc1 \u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc1';
  const rows = [
    { id: 1, name: fullTamil },
    { id: 2, name: 'Grammar (full)' },
    { id: 3, name: 'Grammar ii) Words' },
    { id: 4, name: 'Grammar i) Letters' },
  ];
  const ordered = sortTests(rows);
  assert.deepEqual(ordered.slice(0, 2).map(row => row.id), [4, 3]);
  assert.deepEqual(new Set(ordered.slice(2).map(row => row.id)), new Set([1, 2]));
});
