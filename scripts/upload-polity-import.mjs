import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).flatMap(line => {
  const match = line.match(/^\s*([\w]+)\s*=\s*(.*)\s*$/);
  return match ? [[match[1], match[2].replace(/^(['"])(.*)\1$/, '$2')]] : [];
}));
if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase server credentials');
const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const papers = JSON.parse(fs.readFileSync('imports/polity/prepared.json', 'utf8'));
const clean = value => value.replace(/\s+/g, ' ').trim();
const payload = papers.map(p => {
  if (p.issues.length || p.questions.length !== p.expectedCount) throw new Error(`Unresolved parsing: ${p.name}`);
  return { name: p.name, language: p.language, questions: p.questions.map(q => {
    const row = { question: clean(q.question), category: 'Polity', correct_answer: q.correct_answer };
    for (const label of ['a', 'b', 'c', 'd']) {
      if (!q[`option_${label}`]?.trim()) throw new Error(`Missing option: ${p.name} Q${q.number}`);
      row[`option_${label}`] = clean(q[`option_${label}`]);
    }
    return row;
  }) };
});
fs.writeFileSync('imports/polity/cloud-payload.json', JSON.stringify(payload));
console.log(`Compact payload: ${Buffer.byteLength(JSON.stringify(payload))} bytes`);
const check = async promise => { const { data, error } = await promise; if (error) throw new Error(error.message); return data; };
const seriesName = 'Polity Import Drafts';
let series = await check(db.from('test_series').select('id').eq('name', seriesName).maybeSingle());
if (!series) series = await check(db.from('test_series').insert({ name: seriesName, description: 'Imported Polity papers awaiting review. Do not assign to students yet.', is_free: false }).select('id').single());
let category = await check(db.from('test_categories').select('id').eq('series_id', series.id).eq('name', 'Polity').maybeSingle());
if (!category) category = await check(db.from('test_categories').insert({ series_id: series.id, name: 'Polity', position: 0 }).select('id').single());
const receipt = [];
for (const paper of payload) {
  let test = await check(db.from('tests').select('id,status').eq('category_id', category.id).eq('name', paper.name).maybeSingle());
  if (!test) test = await check(db.from('tests').insert({ category_id: category.id, name: paper.name, language: paper.language, status: 'Draft', question_count: paper.questions.length, total_marks: paper.questions.length, duration: paper.questions.length === 200 ? 180 : 90, description: 'Draft import; verify answer keys and exam settings before publication.' }).select('id,status').single());
  if (test.status !== 'Draft') throw new Error(`Refusing to modify non-draft test ${test.id}`);
  const existing = await check(db.from('questions').select('id,question,option_a,option_b,option_c,option_d,correct_answer').eq('test_id', test.id).order('id'));
  if (existing.length > paper.questions.length) throw new Error(`Unexpected existing rows in test ${test.id}`);
  for (let i = 0; i < existing.length; i++) for (const field of ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']) {
    if (existing[i][field] !== paper.questions[i][field]) {
      if (field === 'correct_answer' && existing[i][field] === null && /^[A-D]$/.test(paper.questions[i][field])) {
        await check(db.from('questions').update({ correct_answer: paper.questions[i][field] }).eq('id', existing[i].id).is('correct_answer', null));
      } else throw new Error(`Existing row differs: test ${test.id}, question ${i + 1}`);
    }
  }
  for (let offset = existing.length; offset < paper.questions.length; offset += 100) {
    await check(db.from('questions').insert(paper.questions.slice(offset, offset + 100).map(q => ({ ...q, test_id: test.id }))));
  }
  const saved = await check(db.from('questions').select('id,question,option_a,option_b,option_c,option_d,correct_answer').eq('test_id', test.id).order('id'));
  if (saved.length !== paper.questions.length) throw new Error(`Upload count mismatch for ${paper.name}`);
  for (let i = 0; i < saved.length; i++) for (const field of ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']) {
    if (saved[i][field] !== paper.questions[i][field]) throw new Error(`Readback mismatch: ${paper.name} Q${i + 1}`);
  }
  receipt.push({ name: paper.name, testId: test.id, questions: saved.length, answers: saved.filter(q => q.correct_answer).length, status: 'Draft' });
  fs.writeFileSync('imports/polity/upload-receipt.json', JSON.stringify({ seriesId: series.id, categoryId: category.id, tests: receipt }, null, 2) + '\n');
  console.log(`${paper.name}: verified ${saved.length} uploaded questions`);
}
