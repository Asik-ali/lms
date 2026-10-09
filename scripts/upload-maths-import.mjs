import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const papers = JSON.parse(fs.readFileSync('imports/maths/prepared.json', 'utf8'));
if (papers.length !== 25 || papers.reduce((sum, paper) => sum + paper.questions.length, 0) !== 610) throw new Error('Expected 25 papers and 610 source questions');
for (const paper of papers) for (const [index, question] of paper.questions.entries()) if (question.number !== index + 1 || !question.question || (question.correct_answer !== null && !/^[A-D]$/.test(question.correct_answer))) throw new Error(`Invalid source data: ${paper.name} Q${question.number}`);
if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase credentials');
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
async function checked(query) { const { data, error } = await query; if (error) throw new Error(error.message); return data; }
async function ensure(table, match, row) {
  let query = db.from(table).select('*');
  for (const [key, value] of Object.entries(match)) query = query.eq(key, value);
  const saved = await checked(query);
  if (saved.length > 1) throw new Error(`Ambiguous ${table} match`);
  return saved[0] || checked(db.from(table).insert(row).select('*').single());
}
const bucket = 'maths-question-images';
const buckets = await checked(db.storage.listBuckets());
if (!buckets.some(item => item.id === bucket)) await checked(db.storage.createBucket(bucket, { public: true, allowedMimeTypes: ['image/png'], fileSizeLimit: 10485760 }));
const series = await ensure('test_series', { name: 'Maths — Topic Wise Practice' }, { name: 'Maths — Topic Wise Practice', description: 'English and Tamil topic papers. Original PDF answer keys retained where legible. Draft imports awaiting formula and missing-answer review.', is_free: false });
const topics = [...new Set(papers.map(paper => paper.topic))];
const receipt = { seriesId: series.id, tests: [] };
const fields = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation'];
for (const paper of papers) {
  const category = await ensure('test_categories', { series_id: series.id, name: paper.topic }, { series_id: series.id, name: paper.topic, position: topics.indexOf(paper.topic) });
  const test = await ensure('tests', { category_id: category.id, name: paper.name }, { category_id: category.id, name: paper.name, language: paper.language, status: 'Draft', duration: paper.questions.length, total_marks: paper.questions.length, question_count: paper.questions.length, difficulty: 'Moderate', syllabus: paper.topic, description: `Source PDF: ${paper.pdfSource}. Formula extraction and correctness need review. ${paper.issues.join('; ')}` });
  if (test.status !== 'Draft') throw new Error(`Refusing to modify published test ${test.id}`);
  const rows = [];
  for (const question of paper.questions) {
    let questionText = question.question;
    if (question.source_image) {
      const objectPath = `tamil-simplification/${path.basename(question.source_image)}`;
      await checked(db.storage.from(bucket).upload(objectPath, fs.readFileSync(question.source_image), { contentType: 'image/png', upsert: true }));
      questionText = db.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
    }
    rows.push({ question: questionText, ...Object.fromEntries(['option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'].map(field => [field, question[field]])), explanation: `Source PDF: ${paper.pdfSource}; Question ${question.number}\n${!question.correct_answer ? 'Source answer missing or unreadable; needs review.\n' : ''}Verify formulas and extracted notation against the original before publication.`, category: paper.topic, type: 'Multiple Choice', difficulty: 'Medium', test_id: test.id });
  }
  const existing = await checked(db.from('questions').select('id,' + fields.join(',')).eq('test_id', test.id).order('id'));
  if (existing.length > rows.length) throw new Error(`Unexpected existing count for ${paper.name}`);
  for (const [index, row] of existing.entries()) for (const field of fields) if (row[field] !== rows[index][field]) throw new Error(`Existing data differs: ${paper.name} Q${index+1} ${field}`);
  if (existing.length < rows.length) await checked(db.from('questions').insert(rows.slice(existing.length)));
  const saved = await checked(db.from('questions').select('id,' + fields.join(',')).eq('test_id', test.id).order('id'));
  if (saved.length !== rows.length) throw new Error(`Saved count mismatch: ${paper.name}`);
  for (const [index, row] of saved.entries()) for (const field of fields) if (row[field] !== rows[index][field]) throw new Error(`Readback mismatch: ${paper.name} Q${index+1} ${field}`);
  receipt.tests.push({ name: paper.name, testId: test.id, categoryId: category.id, topic: paper.topic, language: paper.language, status: 'Draft', questions: saved.length, answers: saved.filter(row => row.correct_answer).length, issues: paper.issues });
  fs.writeFileSync('imports/maths/upload-receipt.json', JSON.stringify(receipt, null, 2) + '\n');
  console.log(`${paper.name}: verified ${saved.length} questions, ${saved.filter(row => row.correct_answer).length} answers (Draft)`);
}
console.log(JSON.stringify({ tests: receipt.tests.length, topics: topics.length, questions: receipt.tests.reduce((sum,test) => sum+test.questions,0), answers: receipt.tests.reduce((sum,test) => sum+test.answers,0) }));
