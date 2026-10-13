import test from 'node:test';
import assert from 'node:assert/strict';
import { sortTests } from '../src/data/testOrder.js';

test('requested Tamil grammar titles show letters, words, then full exam', () => {
  const names = ['தமிழ் - இலக்கணம் i)எழுத்து', 'தமிழ் -இலக்கணம் ii) சொல்', 'தமிழ் -இலக்கணம் (full)'];
  const shuffled = [2, 1, 0].map(id => ({ id, name: names[id], language: 'Tamil' }));
  assert.deepEqual(sortTests(shuffled).map(row => row.name), names);
});

test('requested Unit 3 Tamil titles appear in the exact requested order', () => {
  const names = ['அலகு 3-எழுதும் திறன் ( i)', 'அலகு 3 - எழுதும் திறன் (ii)', 'அலகு 3 முழு தேர்வு'];
  const shuffled = [2, 1, 0].map(id => ({ id, name: names[id], language: 'Tamil' }));
  assert.deepEqual(sortTests(shuffled).map(row => row.name), names);
});

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


test('Tamil screenshot titles keep parts I and II before the full exam despite inconsistent spacing', () => {
  const grammar = '\u0ba4\u0bae\u0bbf\u0bb4\u0bcd - \u0b87\u0bb2\u0b95\u0bcd\u0b95\u0ba3\u0bae\u0bcd';
  const full = '\u0bae\u0bc1\u0bb4\u0bc1 \u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc1';
  const rows = [
    { id: 1, name: 'Unit 3 ' + full },
    { id: 2, name: 'Unit 3-writing (ii)' },
    { id: 3, name: 'Unit 3 - writing ( i)' },
  ];
  assert.deepEqual(sortTests(rows).map(row => row.id), [3, 2, 1]);
  assert.deepEqual(sortTests([
    { id: 4, name: grammar + ' (full)' },
    { id: 5, name: grammar + ' ii) words' },
    { id: 6, name: grammar + ' i)letters' },
  ]).map(row => row.id), [6, 5, 4]);
  assert.deepEqual(sortTests([
    { id: 7, name: full.replace(' ', '\u200B ') },
    { id: 8, name: 'Unit topic' },
  ]).map(row => row.id), [8, 7]);
});
