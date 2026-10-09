import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { correctTamil } from './tamil-spelling.mjs';
const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).flatMap(line => {
  const m = line.match(/^\s*(\w+)\s*=\s*(.*)\s*$/);
  return m ? [[m[1], m[2].replace(/^(['"])(.*)\1$/, '$2')]] : [];
}));
const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const check = async promise => { const { data, error } = await promise; if (error) throw new Error(error.message); return data; };
const receipt = JSON.parse(fs.readFileSync('imports/polity/bilingual-receipt.json', 'utf8'));
const papers = JSON.parse(fs.readFileSync('imports/polity/prepared.json', 'utf8'));
const changes = [];
for (const test of receipt.tests) {
  const rows = await check(db.from('questions').select('id,explanation,correct_answer').eq('test_id', test.testId));
  const paper = papers.find(p => p.name === test.name + ' (Tamil)');
  const updates = [];
  for (const row of rows) {
    const meta = JSON.parse(row.explanation);
    assert.equal(meta.format, 'lms-bilingual-v1');
    const source = paper.questions[meta.number - 1];
    assert.equal(row.correct_answer, source.correct_answer);
    for (const field of ['question', 'option_a', 'option_b', 'option_c', 'option_d']) {
      const before = meta.tamil[field], after = correctTamil(before);
      assert.equal(after, source[field].replace(/\s+/g, ' ').trim());
      if (before !== after) {
        changes.push({ test: test.name, number: meta.number, field, before, after });
        meta.tamil[field] = after;
      }
    }
    if (JSON.stringify(meta) !== row.explanation) updates.push({ id: row.id, explanation: JSON.stringify(meta) });
  }
  fs.writeFileSync('imports/polity/tamil-spelling-changes.json', JSON.stringify(changes, null, 2) + '\n');
  for (let i = 0; i < updates.length; i += 10) await Promise.all(updates.slice(i, i + 10).map(row =>
    check(db.from('questions').update({ explanation: row.explanation }).eq('id', row.id))));
  const saved = await check(db.from('questions').select('id,explanation').eq('test_id', test.testId));
  for (const row of updates) assert.equal(saved.find(q => q.id === row.id).explanation, row.explanation);
  console.log(`${test.name}: ${updates.length} Tamil questions corrected and verified`);
}
console.log(`${changes.length} corrected text fields; answer keys unchanged.`);
