import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { correctTamil } from './tamil-spelling.mjs';

const root = fileURLToPath(new URL('../imports/polity/', import.meta.url));
const verifiedKeys = [
  ['sectional-test-1-english.json', 100],
  ['sectional-test-2-english.json', 100],
  ['full-test-english.json', 200],
].map(([filename, expectedCount]) => {
  const key = JSON.parse(fs.readFileSync(path.join(root, 'answer-keys', filename), 'utf8'));
  if (key.answers.length !== expectedCount || key.answers.some(answer => answer !== null && !/^[A-D]$/.test(answer))) {
    throw new Error(`${filename} must contain exactly ${expectedCount} entries: A-D or null for missing answers.`);
  }
  return key;
});
const papers = [
  ['Polity sectional test 1 english(2).txt', 'Sectional Test I', 'English', 100],
  ['Polity sectional test 2 english(2).txt', 'Sectional Test II', 'English', 100],
  ['Polity_Sectional_Test_2_Tamil.txt', 'Sectional Test II', 'Tamil', 100],
  ['Polity_Sectional_Test_1_Question_Paper_v2(2).txt', 'Sectional Test I', 'Tamil', 100],
  ['Polity full test english(2).txt', 'Full Test', 'English', 200],
  ['Polity full test tamil(2).txt', 'Full Test', 'Tamil', 200],
];

// Preserve source wording. Answer keys require review before database insertion.
const result = papers.map(([source, name, language, expectedCount]) => {
  const verifiedKey = verifiedKeys.find(key => key.paperSource === source || key.additionalPaperSources?.includes(source));
  const text = fs.readFileSync(path.join(root, 'sources', source), 'utf8')
    .replace(/[\u200b\uFEFF]/g, '').replace(/\r/g, '').replace(/\f/g, '\n');
  const candidates = [...text.matchAll(/^[ \t]*(?:Q\s*)?(\d{1,3})(?:\s*[.)]\s*|(?=[A-Za-z\u0B80-\u0BFF]))/gm)];
  const starts = [];
  let expected = 1;
  for (const match of candidates) {
    if (Number(match[1]) !== expected) continue;
    if (starts.length && expected <= 4) {
      const previous = text.slice(starts.at(-1).end, match.index);
      if (!/(?:\(D\)|\bD\)|^\s*4\s*[.)])/m.test(previous)) continue;
    }
    starts.push({ number: expected++, index: match.index, end: match.index + match[0].length });
  }
  const issues = [];
  const questions = starts.map((start, i) => {
    const block = text.slice(start.end, starts[i + 1]?.index ?? text.length).trim();
    let options = [...block.matchAll(/^[ \t]*(?:\(([A-Da-dΑΒ])\s*\)|([A-Da-dΑΒ])\s*[.)])|(?<=\s)([A-D])\s*\)/gm)].map(m => {
      m[1] = (m[1] || m[2] || m[3]).toUpperCase().replace('Α', 'A').replace('Β', 'B');
      return m;
    });
    // Some stems contain labelled statements or matching-table entries.
    // The final four unique labels are the actual answer choices.
    if (options.length >= 4 && new Set(options.slice(-4).map(m => m[1])).size === 4) options = options.slice(-4);
    if (!options.length) {
      const numbered = [...block.matchAll(/^[ \t]*([1-4])\s*[.)]/gm)];
      if (numbered.map(m => m[1]).join('') === '1234') {
        options = numbered.map(m => Object.assign([...m], { 1: 'ABCD'[Number(m[1]) - 1], index: m.index }));
      }
    }
    const row = { number: start.number, question: block.slice(0, options[0]?.index ?? block.length).trim(),
      type: 'Multiple Choice', category: 'Polity', difficulty: 'Moderate',
      correct_answer: verifiedKey ? verifiedKey.answers[start.number - 1] : null, explanation: '' };
    for (let j = 0; j < options.length; j++) {
      const label = (options[j][1] || options[j][2]).toLowerCase();
      row[`option_${label}`] = block.slice(options[j].index + options[j][0].length, options[j + 1]?.index ?? block.length).trim();
    }
    if (options.length !== 4 || new Set(options.map(m => m[1])).size !== 4) {
      issues.push(`Question ${start.number}: options need manual review`);
      row.source_text = block;
    }
    if (language === 'Tamil') {
      for (const field of ['question', 'option_a', 'option_b', 'option_c', 'option_d']) {
        if (row[field]) row[field] = correctTamil(row[field]);
      }
    }
    return row;
  });
  if (questions.length !== expectedCount) issues.push(`Expected ${expectedCount} questions; parsed ${questions.length}. Review source numbering.`);
  return { name: `Polity ${name} (${language})`, source, language, expectedCount, status: 'Draft',
    readyForCloud: false, issues, questions };
});
fs.writeFileSync(path.join(root, 'prepared.json'), JSON.stringify(result, null, 2) + '\n');
for (const paper of result) console.log(`${paper.name}: ${paper.questions.length}/${paper.expectedCount}; ${paper.issues.length} parsing issues; ${paper.questions.filter(q => q.correct_answer).length} answers assigned`);
