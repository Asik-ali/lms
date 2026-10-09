import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).flatMap(line => {
  const m = line.match(/^\s*(\w+)\s*=\s*(.*)\s*$/);
  return m ? [[m[1], m[2].replace(/^(['"])(.*)\1$/, '$2')]] : [];
}));
const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const check = async promise => { const { data, error } = await promise; if (error) throw new Error(error.message); return data; };
const papers = JSON.parse(fs.readFileSync('imports/polity/prepared.json', 'utf8'));
const oldReceipt = JSON.parse(fs.readFileSync('imports/polity/upload-receipt.json', 'utf8'));
const clean = s => s.replace(/\s+/g, ' ').trim();
const fields = ['question', 'option_a', 'option_b', 'option_c', 'option_d'];
const report = { tests: [], sourceReview: [
  'Sectional Test I Q99: matching-statement numbering and options differ between supplied English and Tamil papers; source review required.',
  'Sectional Test II Q100: no supplied answer; remains null.',
], verification: 'All 400 numbered pairs checked for non-empty stems, four options, shared supplied answer letters and exact source-to-cloud text. Semantic/factual source correctness is not certified.' };
for (const english of papers.filter(p => p.language === 'English')) {
  const tamil = papers.find(p => p.name === english.name.replace('(English)', '(Tamil)'));
  assert.equal(tamil.questions.length, english.questions.length);
  const englishId = oldReceipt.tests.find(t => t.name === english.name).testId;
  const tamilId = oldReceipt.tests.find(t => t.name === tamil.name).testId;
  const englishRows = await check(db.from('questions').select('*').eq('test_id', englishId).order('id'));
  const tamilRows = await check(db.from('questions').select('*').eq('test_id', tamilId).order('id'));
  assert.equal(englishRows.length, english.expectedCount);
  assert.equal(tamilRows.length, tamil.expectedCount);
  const updates = [];
  for (let i = 0; i < english.questions.length; i++) {
    const en = english.questions[i], ta = tamil.questions[i];
    assert.equal(en.number, i + 1); assert.equal(ta.number, i + 1);
    assert.equal(en.correct_answer, ta.correct_answer);
    // Match source content, not unspecified database retrieval order.
    const enMatches = englishRows.filter(row => fields.every(f => row[f] === clean(en[f])));
    const taMatches = tamilRows.filter(row => fields.every(f => row[f] === clean(ta[f])));
    assert.equal(enMatches.length, 1, `English Q${i + 1}: source mismatch`);
    assert.equal(taMatches.length, 1, `Tamil Q${i + 1}: source mismatch`);
    for (const f of fields) { assert.ok(en[f].trim()); assert.ok(ta[f].trim()); }
    const metadata = { format: 'lms-bilingual-v1', number: i + 1,
      tamil: Object.fromEntries(fields.map(f => [f, clean(ta[f])])), explanation: '' };
    updates.push({ id: enMatches[0].id, explanation: JSON.stringify(metadata) });
  }
  // Preserve all question IDs and old Tamil attempts; archive the duplicate listing.
  for (let offset = 0; offset < updates.length; offset += 10) {
    await Promise.all(updates.slice(offset, offset + 10).map(update =>
      check(db.from('questions').update({ explanation: update.explanation }).eq('id', update.id))));
  }
  const name = english.name.replace(' (English)', '');
  await check(db.from('tests').update({ name, language: 'English / Tamil', status: 'Draft' }).eq('id', englishId));
  await check(db.from('tests').update({ status: 'Archived' }).eq('id', tamilId));
  const saved = await check(db.from('questions').select('*').eq('test_id', englishId));
  for (const update of updates) assert.equal(saved.find(q => q.id === update.id).explanation, update.explanation);
  report.tests.push({ name, testId: englishId, archivedTamilTestId: tamilId, questions: updates.length, answers: english.questions.filter(q => q.correct_answer).length });
  fs.writeFileSync('imports/polity/bilingual-receipt.json', JSON.stringify(report, null, 2) + '\n');
  console.log(`${name}: ${updates.length} bilingual questions verified; duplicate Tamil listing archived`);
}
