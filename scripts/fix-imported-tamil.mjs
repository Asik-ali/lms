import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { repairTamil } from './tamil-extraction.mjs';

const roots = ['tamil-additional', 'unit5-general', 'unit6-general'];
const fields = ['question', 'option_a', 'option_b', 'option_c', 'option_d'];
const plan = [];
for (const root of roots) {
  const papers = JSON.parse(fs.readFileSync(`imports/${root}/prepared.json`, 'utf8'));
  const receipt = JSON.parse(fs.readFileSync(`imports/${root}/upload-receipt.json`, 'utf8'));
  for (const paper of papers) {
    const entry = receipt.tests.find(test => test.source === paper.source);
    if (!entry) throw new Error(`Missing uploaded test: ${paper.source}`);
    for (const question of paper.questions) {
      const spellingExercise = /பிழை|பிழையற்ற|சந்தி|சரியான\s+சொல்லை|சரியான\s+சொற்களை/.test(question.question);
      const changes = {};
      for (const field of fields) {
        const after = repairTamil(question[field], field !== 'question' && spellingExercise);
        if (after !== question[field]) changes[field] = { before: question[field], after };
      }
      if (Object.keys(changes).length) plan.push({root, source: paper.source, testId: entry.testId, number: question.number, correct_answer: question.correct_answer, changes});
    }
  }
}
fs.mkdirSync('imports/tamil-text-repair', {recursive: true});
fs.writeFileSync('imports/tamil-text-repair/plan.json', JSON.stringify(plan, null, 2) + '\n');
console.log(JSON.stringify({questions: plan.length, fields: plan.reduce((sum, row) => sum + Object.keys(row.changes).length, 0), tests: new Set(plan.map(row => row.testId)).size}));
if (!process.argv.includes('--apply')) process.exit(0);
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth: {persistSession: false}});
async function checked(query) {const {data, error} = await query; if (error) throw new Error(error.message); return data;}
const snapshots = [];
// Validate every record before changing any record.
for (const testId of new Set(plan.map(row => row.testId))) {
  const test = await checked(db.from('tests').select('id,status,language').eq('id', testId).single());
  if (test.status !== 'Draft' || test.language !== 'Tamil') throw new Error(`Unexpected test metadata: ${testId}`);
  const saved = await checked(db.from('questions').select('id,correct_answer,' + fields.join(',')).eq('test_id', testId).order('id'));
  for (const item of plan.filter(row => row.testId === testId)) {
    const row = saved[item.number - 1];
    if (!row || row.correct_answer !== item.correct_answer || Object.entries(item.changes).some(([field, change]) => row[field] !== change.before && row[field] !== change.after)) throw new Error(`Source mismatch: test ${testId} Q${item.number}`);
    item.id = row.id;
  }
  snapshots.push({testId, questions: saved});
}
fs.writeFileSync('imports/tamil-text-repair/before.json', JSON.stringify(snapshots, null, 2) + '\n');
// Limit concurrency; update only the changed text columns, never the answer key.
for (let start = 0; start < plan.length; start += 8) {
  await Promise.all(plan.slice(start, start + 8).map(async item => {
    const updated = await checked(db.from('questions').update(Object.fromEntries(Object.entries(item.changes).map(([field, value]) => [field, value.after]))).eq('id', item.id).eq('test_id', item.testId).select('id'));
    if (updated.length !== 1) throw new Error(`Update failed: ${item.id}`);
  }));
}
for (const snapshot of snapshots) {
  const saved = await checked(db.from('questions').select('id,correct_answer,' + fields.join(',')).eq('test_id', snapshot.testId).order('id'));
  if (saved.length !== snapshot.questions.length) throw new Error('Count changed');
  for (const [index, row] of saved.entries()) {
    const before = snapshot.questions[index];
    const item = plan.find(item => item.id === row.id);
    if (before.id !== row.id || before.correct_answer !== row.correct_answer || fields.some(field => row[field] !== (item?.changes[field]?.after ?? before[field]))) throw new Error(`Readback mismatch: ${row.id}`);
  }
}
for (const root of roots) {
  const file = `imports/${root}/prepared.json`;
  const papers = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const item of plan.filter(item => item.root === root)) {
    const question = papers.find(p => p.source === item.source).questions[item.number - 1];
    for (const [field, change] of Object.entries(item.changes)) question[field] = change.after;
  }
  fs.writeFileSync(file, JSON.stringify(papers, null, 2) + '\n');
}
fs.writeFileSync('imports/tamil-text-repair/receipt.json', JSON.stringify({tests: snapshots.length, questionsCorrected: plan.length, fieldsCorrected: plan.reduce((n, r) => n + Object.keys(r.changes).length, 0), answersPreserved: true, verified: true}, null, 2) + '\n');
console.log('Verified corrected text and unchanged answer keys in Supabase.');
