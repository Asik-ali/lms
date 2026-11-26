import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const directory = 'imports/maths-pyq-parts';
const snapshotPath = `${directory}/before.json`;
if (fs.existsSync('imports/maths-pyq-text/text-preview-receipt.json')) throw new Error('Text previews have been attached to the split parts. Do not rerun the original content migration; use audit-maths-pyq.mjs for verification.');
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function checked(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}
const categories = await checked(db.from('test_categories').select('id,name').eq('series_id', 12));
assert.equal(categories.length, 13);
const tests = await checked(db.from('tests').select('*').in('category_id', categories.map(c => c.id)));
const attempts = await checked(db.from('test_attempts').select('id,test_id').in('test_id', tests.map(t => t.id)));
const attemptedIds = new Set(attempts.map(a => a.test_id));
let snapshot;
if (fs.existsSync(snapshotPath)) snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
else {
  assert.equal(tests.length, 13, 'Expected original 13 topics before first split');
  snapshot = [];
  for (const test of tests) {
    assert.ok(['Draft', 'Published'].includes(test.status));
    const questions = await checked(db.from('questions').select('*').eq('test_id', test.id).order('id'));
    questions.sort((a, b) => JSON.parse(a.explanation).number - JSON.parse(b.explanation).number);
    assert.equal(questions.length, test.question_count);
    questions.forEach((q, i) => assert.equal(JSON.parse(q.explanation).number, i + 1));
    snapshot.push({ test, questions });
  }
  assert.equal(snapshot.reduce((n, t) => n + t.questions.length, 0), 1081);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n');
}
const plan = snapshot.flatMap(({ test, questions }) => Array.from({ length: Math.ceil(questions.length / 25) }, (_, i) => ({
  originalTestId: test.id, categoryId: test.category_id, preserveOriginal: attemptedIds.has(test.id) || test.status === 'Published',
  name: `${test.name.replace(/ - Part .*$/, '')} - Part ${i + 1}`,
  part: i + 1, start: i * 25 + 1, end: Math.min((i + 1) * 25, questions.length),
  questionIds: questions.slice(i * 25, (i + 1) * 25).map(q => q.id),
})));
assert.equal(plan.length, 51);
fs.writeFileSync(`${directory}/plan.json`, JSON.stringify(plan, null, 2) + '\n');
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({ topics: 13, parts: plan.length, questions: 1081, attempts: attempts.length, apply: false }));
  process.exit(0);
}
for (const part of plan) {
  const original = snapshot.find(s => s.test.id === part.originalTestId).test;
  const fields = {
    name: part.name, question_count: part.questionIds.length,
    total_marks: original.total_marks / original.question_count * part.questionIds.length,
    duration: Math.ceil(original.duration / original.question_count * part.questionIds.length),
    description: `${original.description || ''}\nPart ${part.part}: original source questions ${part.start}-${part.end}.`.trim(),
  };
  let target = part.part === 1 && !part.preserveOriginal ? tests.find(t => t.id === original.id) : tests.find(t => t.category_id === part.categoryId && t.name === part.name);
  if (!target) {
    const { id, created_at, ...copy } = original;
    target = await checked(db.from('tests').insert({ ...copy, ...fields, status: 'Draft' }).select('*').single());
    tests.push(target);
  }
  assert.ok(['Draft', 'Published'].includes(target.status));
    if (part.preserveOriginal) {
    const existing = await checked(db.from('questions').select('id,explanation').eq('test_id', target.id));
    const numbers = new Set(existing.map(q => JSON.parse(q.explanation).number));
    const copies = snapshot.find(s => s.test.id === original.id).questions.filter(q => part.questionIds.includes(q.id) && !numbers.has(JSON.parse(q.explanation).number)).map(q => {
      const { id, created_at, ...copy } = q;
      return { ...copy, test_id: target.id };
    });
    if (copies.length) await checked(db.from('questions').insert(copies));
  } else await checked(db.from('questions').update({ test_id: target.id }).in('id', part.questionIds));
  await checked(db.from('tests').update(fields).eq('id', target.id));
  part.testId = target.id;
}
const seen = new Set();
for (const part of plan) {
  const rows = await checked(db.from('questions').select('*').eq('test_id', part.testId));
  assert.equal(rows.length, part.questionIds.length);
  assert.ok(rows.length <= 25);
  for (const row of rows) {
    assert.ok(!seen.has(row.id)); seen.add(row.id);
    const before = snapshot.find(s => s.test.id === part.originalTestId).questions.find(q => JSON.parse(q.explanation).number === JSON.parse(row.explanation).number);
    const { test_id: previousTest, id: previousId, created_at: previousCreated, ...previous } = before;
    const { test_id: currentTest, id: currentId, created_at: currentCreated, ...current } = row;
    assert.deepEqual(current, previous, `Question content changed: ${row.id}`);
  }
}
assert.equal(seen.size, 1081);
// Publish only after all replacement questions have passed the content checks.
for (const { test, questions } of snapshot) {
  const parts = plan.filter(p => p.originalTestId === test.id);
  await checked(db.from('tests').update({ status: test.status }).in('id', parts.map(p => p.testId)));
  if (parts[0].preserveOriginal) {
    const originalQuestions = await checked(db.from('questions').select('*').eq('test_id', test.id).order('id'));
    assert.deepEqual(originalQuestions, [...questions].sort((a,b)=>a.id-b.id), 'Historic questions must remain unchanged');
    await checked(db.from('tests').update({ status: 'Archived' }).eq('id', test.id));
  }
}
const finalAttempts = await checked(db.from('test_attempts').select('id,test_id').in('test_id', tests.map(t => t.id)));
for (const attempt of attempts) assert.ok(finalAttempts.some(a => a.id === attempt.id && a.test_id === attempt.test_id));
const finalTests = await checked(db.from('tests').select('id,question_count').in('category_id', categories.map(c => c.id)).neq('status', 'Archived'));
assert.equal(finalTests.length, 51);
assert.equal(finalTests.reduce((n,t)=>n+t.question_count,0), 1081);
fs.writeFileSync(`${directory}/receipt.json`, JSON.stringify({ seriesId: 12, topics: 13, questions: seen.size, parts: plan }, null, 2) + '\n');
console.log('Verified: all 13 topics split into 51 parts; all 1081 questions preserved; attempted originals archived with results intact.');


