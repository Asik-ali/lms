import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const papers = JSON.parse(fs.readFileSync('imports/tamil/prepared.json', 'utf8'));
const fields = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
if (papers.length !== 10 || papers.some(paper => paper.questions.length !== 100 || paper.questions.some((question, index) => question.number !== index + 1 || !question.question || !/^[A-D]$/.test(question.correct_answer)))) throw new Error('Expected ten complete, numbered answer keys');
if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase configuration');
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
async function checked(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}
async function ensure(table, match, row) {
  let query = db.from(table).select('*');
  for (const [field, value] of Object.entries(match)) query = query.eq(field, value);
  const existing = await checked(query);
  if (existing.length > 1) throw new Error(`Ambiguous ${table} match`);
  return existing[0] || checked(db.from(table).insert(row).select('*').single());
}
const seriesName = 'தமிழ் — அலகு வாரியான தேர்வுகள்';
const series = await ensure('test_series', { name: seriesName }, { name: seriesName, description: 'Nine Tamil-only tests. Answer keys supplied by the user. Drafts pending review of source extraction errors.', is_free: false });
const categories = ['அலகு 1 — இலக்கணம்', 'அலகு 2 — சொல்லகராதி', 'அலகு 3 — எழுதும் திறன்', 'அலகு 4'];
const receipt = { seriesId: series.id, seriesName, tests: [] };
for (const paper of papers) {
  const category = await ensure('test_categories', { series_id: series.id, name: paper.category }, { series_id: series.id, name: paper.category, position: categories.indexOf(paper.category) });
  if (!categories.includes(paper.category)) throw new Error(`Unknown Tamil category: ${paper.category}`);
  if (category.position !== categories.indexOf(paper.category)) await checked(db.from('test_categories').update({ position: categories.indexOf(paper.category) }).eq('id', category.id).eq('series_id', series.id));
  const test = await ensure('tests', { category_id: category.id, name: paper.name }, { category_id: category.id, name: paper.name, language: 'Tamil', status: 'Draft', duration: 90, total_marks: 100, question_count: 100, syllabus: paper.category, description: `Source: ${paper.source}. User-supplied answer key matched for all 100 questions. ${paper.issues.length} source text/option review flags; review before publication.` });
  if (test.status !== 'Draft') throw new Error(`Refusing to modify non-draft test ${test.id}`);
  const existing = await checked(db.from('questions').select('id,question,option_a,option_b,option_c,option_d,correct_answer').eq('test_id', test.id).order('id'));
  if (existing.length > 100) throw new Error(`Unexpected rows in test ${test.id}`);
  for (let index = 0; index < existing.length; index++) {
    for (const field of fields) if (existing[index][field] !== paper.questions[index][field]) throw new Error(`Existing data differs: ${paper.source} Q${index + 1} ${field}`);
  }
  const rows = paper.questions.slice(existing.length).map(question => ({
    ...Object.fromEntries(fields.map(field => [field, question[field]])),
    test_id: test.id,
    type: 'Multiple Choice',
    category: paper.category,
    difficulty: 'Medium',
    explanation: `Source: ${paper.source}; Question ${question.number}\n${paper.issues.filter(issue => issue.number === question.number).map(issue => issue.issue).join('\n')}`,
  }));
  if (rows.length) await checked(db.from('questions').insert(rows));
  const saved = await checked(db.from('questions').select('id,question,option_a,option_b,option_c,option_d,correct_answer').eq('test_id', test.id).order('id'));
  if (saved.length !== 100) throw new Error(`Wrong saved count for ${paper.source}`);
  for (let index = 0; index < saved.length; index++) for (const field of fields) if (saved[index][field] !== paper.questions[index][field]) throw new Error(`Readback mismatch: ${paper.source} Q${index + 1} ${field}`);
  receipt.tests.push({ source: paper.source, testId: test.id, categoryId: category.id, language: 'Tamil', status: 'Draft', questions: saved.length, answers: saved.filter(question => question.correct_answer).length, reviewFlags: paper.issues.length });
  fs.writeFileSync('imports/tamil/upload-receipt.json', JSON.stringify(receipt, null, 2) + '\n');
  console.log(`${paper.name}: verified 100 questions and 100 answers (Tamil, Draft)`);
}
console.log('Verified ten draft tests, 1000 questions and 1000 answers.');
