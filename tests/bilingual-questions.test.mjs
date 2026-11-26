import test from 'node:test';
import assert from 'node:assert/strict';
import { localizeQuestion, orderQuestions, questionOptionLetters } from '../src/data/bilingualQuestions.js';

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

test('source option E stays selectable in both languages without changing legacy options', () => {
  const row = { id: 1, question: 'English', explanation: JSON.stringify({ format: 'lms-bilingual-v1', number: 1, extraOptions: { option_e: 'Option E' }, tamil: { question: 'Tamil' } }) };
  assert.deepEqual(questionOptionLetters(row), ['A', 'B', 'C', 'D', 'E']);
  assert.equal(localizeQuestion(row, 'Tamil').option_e, 'Option E');
  assert.deepEqual(questionOptionLetters({ question: 'Legacy' }), ['A', 'B', 'C', 'D']);
});

test('text previews follow language without replacing source images or graded choices', () => {
  const english = { status: 'unreviewed', question: 'English preview', option_a: 'Preview A' };
  const tamil = { status: 'unreviewed', question: 'Tamil preview', option_a: 'Tamil preview A' };
  const row = { id: 9, test_id: 110, question: 'https://example.com/en.webp', option_a: 'Option A', correct_answer: 'B',
    explanation: JSON.stringify({ format: 'lms-bilingual-v1', number: 30, textVersions: { english, tamil }, tamil: { question: 'https://example.com/ta.webp' } }) };
  const localized = localizeQuestion(row, 'Tamil');
  assert.deepEqual(localized.textVersion, tamil);
  assert.deepEqual(localizeQuestion(row).textVersion, english);
  assert.equal(localized.question, 'https://example.com/ta.webp');
  assert.equal(localized.option_a, 'Option A');
  assert.equal(localized.correct_answer, 'B');
  assert.equal(localized.id, 9);
  assert.equal(localized.test_id, 110);
  assert.equal(localized.explanation, '');
  assert.equal(localizeQuestion({ ...row, explanation: JSON.stringify({ format: 'lms-bilingual-v1' }) }).textVersion, null);
});
