import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const root = 'imports/maths-pyq-text';
const previews = JSON.parse(fs.readFileSync(`${root}/text-previews.json`, 'utf8'));
const split = JSON.parse(fs.readFileSync('imports/maths-pyq-parts/receipt.json', 'utf8'));
assert.equal(previews.length, 1081);
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function checked(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}
const categories = await checked(db.from('test_categories').select('id,name').eq('series_id', 12));
const tests = await checked(db.from('tests').select('id,category_id,status').in('id', split.parts.map(p => p.testId)));
assert.equal(tests.length, 51);
const candidates = new Map(previews.map(p => [`${p.topic}:${p.number}`, p.textVersions]));
const rows = [];
for (const test of tests) {
  assert.notEqual(test.status, 'Archived');
  const topic = categories.find(c => c.id === test.category_id)?.name;
  const questions = await checked(db.from('questions').select('*').eq('test_id', test.id));
  assert.ok(questions.length > 0 && questions.length <= 25);
  for (const question of questions) {
    const meta = JSON.parse(question.explanation);
    assert.equal(meta.format, 'lms-bilingual-v1');
    assert.ok(!meta.sourceAnswers);
    const textVersions = candidates.get(`${topic}:${meta.number}`);
    assert.ok(textVersions, `Missing preview ${topic}:${meta.number}`);
    for (const language of ['english', 'tamil']) {
      const text = textVersions[language];
      assert.ok(text.question.trim());
      assert.equal(text.status, 'unreviewed');
      assert.ok(Object.keys(text).every(k => ['status', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'option_e'].includes(k)));
    }
    rows.push({ question, topic, number: meta.number, explanation: JSON.stringify({ ...meta, textVersions }) });
  }
}
assert.equal(rows.length, 1081);
assert.equal(new Set(rows.map(r => r.question.id)).size, 1081);
if (!process.argv.includes('--apply')) {
  console.log('Validated 1081 bilingual previews across 51 parts. Use --apply to attach text alongside images.');
  process.exit(0);
}
const backupPath = `${root}/before-text-previews.json`;
if (!fs.existsSync(backupPath)) fs.writeFileSync(backupPath, JSON.stringify(rows.map(r => r.question), null, 2) + '\n');
const repaired = rows.find(r => r.topic === 'Average' && r.number === 22);
assert.ok(repaired);
const image = fs.readFileSync('imports/maths-pyq/images/paper-05/q022.webp');
const imagePath = `corrected/average-q022-${crypto.createHash('sha256').update(image).digest('hex').slice(0, 16)}.webp`;
await checked(db.storage.from('maths-pyq-images').upload(imagePath, image, { contentType: 'image/webp', upsert: true }));
repaired.repairedImage = db.storage.from('maths-pyq-images').getPublicUrl(imagePath).data.publicUrl;
let position = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (position < rows.length) {
    const { question, explanation, repairedImage } = rows[position++];
    if (explanation !== question.explanation || (repairedImage && repairedImage !== question.question)) {
      const updated = await checked(db.from('questions').update({ explanation, ...(repairedImage ? { question: repairedImage } : {}) }).eq('id', question.id).eq('explanation', question.explanation).select('id'));
      assert.equal(updated.length, 1, `Concurrent question edit: ${question.id}`);
    }
  }
}));
for (const test of tests) {
  const saved = await checked(db.from('questions').select('*').eq('test_id', test.id));
  for (const question of saved) {
    const before = rows.find(r => r.question.id === question.id);
    assert.ok(before);
    assert.deepEqual(question, { ...before.question, explanation: before.explanation, ...(before.repairedImage ? { question: before.repairedImage } : {}) });
  }
}
fs.writeFileSync(`${root}/text-preview-receipt.json`, JSON.stringify({ seriesId: 12, parts: 51, questions: 1081, languages: ['English', 'Tamil'], status: 'unreviewed', originalImagesAvailable: true, repairedImages: [{ topic: 'Average', number: 22, url: repaired.repairedImage }], answerKeysUnchanged: true, questionIds: rows.map(r => r.question.id) }, null, 2) + '\n');
console.log('Verified all 1081 bilingual text previews with original images; Average Q22 crop repaired. Canonical options, answer keys and question IDs unchanged.');
