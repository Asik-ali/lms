import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const root = 'imports/unit6-general';
const paper = JSON.parse(fs.readFileSync(`${root}/prepared.json`, 'utf8')).find(p => p.source === 'unit 6 thirukural.txt');
const receipt = JSON.parse(fs.readFileSync(`${root}/upload-receipt.json`, 'utf8'));
const entry = receipt.tests.find(t => t.source === paper.source);
if (paper.questions.length !== 100 || paper.questions.some((q, i) => q.number !== i + 1 || !/^[A-D]$/.test(q.correct_answer))) throw new Error('Invalid 100-answer key');
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function checked(query) { const { data, error } = await query; if (error) throw new Error(error.message); return data; }
const test = await checked(db.from('tests').select('id,language,status,category_id,description').eq('id', entry.testId).single());
if (test.language !== 'Tamil' || test.status !== 'Draft' || test.category_id !== entry.categoryId) throw new Error('Test metadata differs');
const fields = ['question','option_a','option_b','option_c','option_d'];
const rows = await checked(db.from('questions').select('id,correct_answer,' + fields.join(',')).eq('test_id', test.id).order('id'));
if (rows.length !== 100) throw new Error('Wrong saved count');
for (const [i, row] of rows.entries()) {
  if (fields.some(f => row[f] !== paper.questions[i][f])) throw new Error(`Source mismatch at Q${i + 1}`);
  if (row.correct_answer !== null && row.correct_answer !== paper.questions[i].correct_answer) throw new Error(`Existing answer differs at Q${i + 1}`);
}
for (const [i, row] of rows.entries()) if (row.correct_answer === null) {
  const changed = await checked(db.from('questions').update({ correct_answer: paper.questions[i].correct_answer }).eq('id', row.id).eq('test_id', test.id).is('correct_answer', null).select('id'));
  if (changed.length !== 1) throw new Error(`Concurrent change at Q${i + 1}`);
}
await checked(db.from('tests').update({ description: `Source: ${paper.source}. ${paper.answerKeyStatus} Review source text before publication.` }).eq('id', test.id).eq('status', 'Draft'));
const saved = await checked(db.from('questions').select('id,correct_answer').eq('test_id', test.id).order('id'));
if (saved.length !== 100 || saved.some((q, i) => q.id !== rows[i].id || q.correct_answer !== paper.questions[i].correct_answer)) throw new Error('Answer readback mismatch');
const series = await checked(db.from('test_series').select('description').eq('id', receipt.seriesId).single());
await checked(db.from('test_series').update({ description: series.description.replace('Thirukkural answer key pending.', 'All three answer keys supplied by the user.') }).eq('id', receipt.seriesId));
entry.answers = 100;
entry.answerKeyStatus = paper.answerKeyStatus;
fs.writeFileSync(`${root}/upload-receipt.json`, JSON.stringify(receipt, null, 2) + '\n');
console.log('Verified test ' + test.id + ': 100/100 Thirukkural answers saved; Tamil, Draft.');
