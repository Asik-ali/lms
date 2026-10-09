import test from 'node:test';
import assert from 'node:assert/strict';
import { localizeQuestion, orderQuestions } from '../src/data/bilingualQuestions.js';

test('language switching preserves question identity, grading and option letters', () => {
  const row = { id: 91, question: 'English question', option_a: 'English A', correct_answer: 'A',
    explanation: JSON.stringify({ format: 'lms-bilingual-v1', number: 1, tamil: { question: 'தமிழ்', option_a: 'தமிழ் A' } }) };
  const tamil = localizeQuestion(row, 'Tamil');
  assert.equal(tamil.question, 'தமிழ்');
  assert.equal(tamil.option_a, 'தமிழ் A');
  assert.equal(tamil.id, row.id);
  assert.equal(tamil.correct_answer, 'A');
  assert.equal(localizeQuestion(row).question, row.question);
  assert.equal(tamil.explanation, '');
  assert.equal(row.question, 'English question');
});

test('numbered translations order questions independently of database order', () => {
  const row = (id, number) => ({ id, explanation: JSON.stringify({ format: 'lms-bilingual-v1', number }) });
  const input = [row(10, 2), row(20, 1)];
  assert.deepEqual(orderQuestions(input).map(q => q.id), [20, 10]);
  assert.deepEqual(input.map(q => q.id), [10, 20]);
  const legacy = { id: 1, question: 'Existing question', explanation: 'Normal explanation' };
  assert.equal(localizeQuestion(legacy, 'Tamil'), legacy);
});
