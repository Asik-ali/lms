import fs from 'node:fs';

const papers = JSON.parse(fs.readFileSync('imports/tamil/prepared.json', 'utf8'));
const labels = ['a', 'b', 'c', 'd'];
const missing = [];
const duplicates = [];
const textFlags = [];
const pdfFindings = [
  { test: 'அலகு 2. சொல்லகராதி (ii) (iii)', number: 22, page: 7, finding: 'PDF has option B with text அதனால்; TXT uses Greek Β, which the parser did not recognize.', resolution: 'Repair parser label recognition.' },
  { test: 'அலகு 2. சொல்லகராதி (ii) (iii)', number: 43, page: 14, finding: 'PDF also has four numbered statements and no A–D answer choices.', resolution: 'Author must specify how the statements map to the supplied answer letter; do not invent choices.' },
  { test: 'அலகு 3 முழு தேர்வு', number: 38, page: 11, finding: 'PDF has complete option D; TXT label is malformed as [D).', resolution: 'Repair label parsing; preserve intentionally incorrect sentences.' },
  { test: 'அலகு 3-எழுதும் திறன் ( i)', number: 17, page: 5, finding: 'PDF has complete option A; TXT uses Greek Α.', resolution: 'Repair parser label recognition.' },
  { test: 'தமிழ் - இலக்கணம் i)எழுத்து', number: 61, page: 17, finding: 'Third option is labeled O in the PDF itself.', resolution: 'Normalize label to C after source review; preserve its intentionally different spelling.' },
  { test: 'தமிழ் - இலக்கணம் i)எழுத்து', number: 82, page: 23, finding: 'PDF has complete option A; TXT label is malformed as A].', resolution: 'Repair label parsing.' },
  { test: 'தமிழ் -இலக்கணம் (full)', number: 4, page: 1, finding: 'Second option is labeled 8) in the PDF itself.', resolution: 'Normalize label to B after source review.' },
  { test: 'தமிழ் -இலக்கணம் (full)', number: 28, page: 8, finding: 'PDF option A is missing the closing bracket.', resolution: 'Repair label parsing.' },
  { test: 'தமிழ் -இலக்கணம் (full)', number: 72, page: 21, finding: 'PDF option B has an extra opening bracket.', resolution: 'Repair label parsing.' },
  { test: 'தமிழ் -இலக்கணம் (full)', number: 84, page: 25, finding: 'PDF option B has an extra opening bracket.', resolution: 'Repair label parsing.' },
  { test: 'தமிழ் அலகு 2 (முழு தேர்வு)', number: 79, page: 24, finding: 'PDF itself labels both the second and fourth choices D.', resolution: 'Normalize second choice label to B after source review.' },
  { test: 'தமிழ் அலகு 2 (முழு தேர்வு)', number: 98, page: 29, finding: 'PDF itself labels both the second and third choices C.', resolution: 'Normalize second choice label to B after source review.' },
  { test: 'தமிழ் - இலக்கணம் i)எழுத்து', number: 57, page: 16, finding: 'Repeated A/C option text is also present in the PDF.', resolution: 'Author review required to produce distinct choices.' },
  { test: 'தமிழ் -இலக்கணம் ii) சொல்', number: 33, page: 9, finding: 'Repeated A/C option text is also present in the PDF.', resolution: 'Author review required to produce distinct choices.' },
];
for (const paper of papers) {
  for (const question of paper.questions) {
    const absent = labels.filter(label => !question[`option_${label}`]?.trim());
    if (absent.length) missing.push({ test: paper.name, number: question.number, missing: absent.map(label => label.toUpperCase()), source: question.source_text });
    const options = labels.map(label => question[`option_${label}`]?.trim()).filter(Boolean);
    if (new Set(options).size !== options.length) duplicates.push({ test: paper.name, number: question.number, options });
  }
  for (const issue of paper.issues.filter(issue => /extraction error/.test(issue.issue))) textFlags.push({ test: paper.name, ...issue });
}
const report = {
  scope: 'Structural screening of all 1000 imported questions; visual inspection of all 12 missing-option cases, both duplicate-option cases, and the original vocabulary PDF page 1. Full linguistic and subject-matter verification is still outstanding.',
  pdfFindings,
  tests: papers.length,
  questions: papers.reduce((count, paper) => count + paper.questions.length, 0),
  missingOptions: missing,
  duplicateOptions: duplicates,
  extractionFlags: textFlags,
  sourceVerifiedExamples: [
    { test: 'அலகு 2 - சொல்லகராதி (i)', number: 4, before: 'ஒரு மொழியைத் ததோக', after: 'ஒரு மொழியைத் தேர்க', reason: 'Original PDF page 1 visually checked' },
    { test: 'அலகு 2 - சொல்லகராதி (i)', number: 4, field: 'option_d', before: 'மமோ', after: 'மோ', reason: 'Original PDF page 1 visually checked' },
  ],
  recommendations: [
    'Repair option labels using the original PDF; do not infer missing answer text.',
    'Review doubled Tamil characters and detached letter fragments against source pages.',
    'Preserve deliberately incorrect spellings, sentences, and matching pairs used as answer choices.',
    'Preserve answer letters and question order; supplied answer keys are not independent proof of subject-matter correctness.',
    'Keep tests as drafts until source discrepancies have been resolved.',
  ],
};
fs.writeFileSync('imports/tamil/grammar-review.json', JSON.stringify(report, null, 2) + '\n');
const markdown = [
  '# Tamil question review', '', report.scope, '',
  `- Tests: ${report.tests}`, `- Questions: ${report.questions}`, `- Questions with missing or unreadable option labels: ${missing.length}`, `- Questions with repeated nonempty option text: ${duplicates.length}`, `- Questions flagged for possible extraction damage: ${textFlags.length}`, '',
  '## Missing or unreadable options', '', '| Test | Question | Option |', '| --- | --- | --- |',
  ...missing.map(item => `| ${item.test} | ${item.number} | ${item.missing.join(', ')} |`), '',
  'Most entries have the text in the original TXT but malformed labels such as Greek Α/Β, `[D)`, `((B)`, `8)`, or a missing bracket. Vocabulary (ii)/(iii), question 43 has four numbered statements and no A–D answer choices in the supplied TXT. Unit 2 Full Test questions 79 and 98 contain repeated option labels and need comparison with the PDF.', '',
  '## Repeated option text', '',
  ...duplicates.map(item => `- ${item.test}, question ${item.number}: ${item.options.join(' / ')}`), '',
  '## Original PDF findings', '', '| Test | Question | PDF page | Finding |', '| --- | --- | --- | --- |',
  ...pdfFindings.map(item => `| ${item.test} | ${item.number} | ${item.page} | ${item.finding} ${item.resolution} |`), '',
  '## Examples checked against the source PDF', '',
  ...report.sourceVerifiedExamples.map(item => `- ${item.test}, question ${item.number}: ${item.before} → ${item.after}.`), '',
  '## Next steps', '', ...report.recommendations.map(item => `- ${item}`), '',
];
fs.writeFileSync('imports/tamil/grammar-review.md', markdown.join('\n'));
console.log(JSON.stringify({ tests: report.tests, questions: report.questions, missingOptions: missing.length, duplicateOptions: duplicates.length, extractionFlags: textFlags.length }));
