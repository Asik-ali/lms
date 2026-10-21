import fs from 'node:fs';
import { parsePaper } from './prepare-tamil-import.mjs';
import { repairPaperText } from './tamil-extraction.mjs';

// Transcribed by question number from the five user-supplied handwritten keys.
const keys = {
  5: ['BBAACBCCAB','ACBDCCDBAA','BDBACBB D AC','AABABCCADA','DBBCBCABCC','BABDBCBDBC','CACCBBCDCD','CDBCBCCCCC','CDDBCDDBBC','BCCADB CDDA'],
  6: ['CCDDCBDACC','AADBAACDAB','AACDBCD AAD','DDBBBAAABA','CCBBBC AACC','ACDBBCDCBC','CAACADCABC','DACDBBBBCB','DCDBBAADDA','BAACCBACCD'],
  7: ['DDBDAAACBB','BADBACDCAA','BAB AAB DCCB','ACC DCCBBAB','BBBBCBCDBB','DCCDCBC DDB','BDD CBAACCC','DDCBABBCAC','BBB AADBCDB','CCABCCCDDC'],
  full7: ['BADCDBBADC','BBDDCBCBAA','ACCCCADBCC','ADAABCAABB','ADAADADAAD','BAABCBABCA','CDDABCBBCC','ABBBAABDBA','BBACCDDBCB','ADDBADBDAC'],
  part7: ['DABABBDAAA','ADBCBBCBDB','CDDCCCDBDB','CBCABDDBCC','CCBABACBBA','ACBDDDADBC','DABCACBCAC','BBBDAACCAB','BBBADBACBB','BACAAAD BBD'],
};
const root = 'imports/tamil-additional';
const papers = fs.readdirSync(`${root}/source`).filter(name => name.endsWith('.txt')).sort().map(source => {
  const unit = Number(source.match(/\d/)[0]);
  const raw = fs.readFileSync(`${root}/source/${source}`, 'utf8');
  const normalized = raw.replace(/Α/g, 'A').replace(/^D}/gm, 'D)').replace(/^ID\)/gm, 'D)').replace(/^42 '/gm, "42. '").replace(/^A (?=தாம்)/gm, 'A) ').replace(/^A\)\)/gm, 'A)').replace(/^\(A (?=முதும)/gm, '(A) ').replace(/^\*B\)/gm, 'B)');
  const questions = parsePaper(normalized);
  const key = source === 'அலகு - 7 முழு தேர்வு.txt' ? 'full7' : source === 'unit 7 2.txt' ? 'part7' : unit;
  const answers = keys[key].map(group => group.replace(/\s/g, ''));
  if (answers.some(group => group.length !== 10)) throw new Error(`Bad ten-answer group: unit ${unit}: ${answers.map(s => s.length)}`);
  const sequence = answers.join('');
  const issues = [];
  for (const question of questions) {
    question.correct_answer = sequence[question.number - 1];
    for (const label of ['a','b','c','d']) if (!question[`option_${label}`]) throw new Error(`Missing option: ${source} Q${question.number}`);
    if (/[\u0b95-\u0bb9]\s*\n[\u0b95-\u0bb9]/.test(question.source_text)) issues.push({ number: question.number, issue: 'Detached or doubled Tamil text in PDF extraction; review original before publication.' });
  }
  return { source, name: key === 'part7' ? 'அலகு 7 (ii) — தமிழின் தொன்மை - நாமக்கல் கவிஞர்' : source.replace(/\.txt$/, ''), category: `அலகு ${unit}${key === 7 ? ' — திருக்குறள், அறநூல்கள்' : ''}`, language: 'Tamil', questions, issues, answerKeyStatus: 'User-provided; 100 answers matched by question number' };
});
if (papers.length !== 5) throw new Error('Expected five papers');
repairPaperText(papers);
fs.writeFileSync(`${root}/prepared.json`, JSON.stringify(papers, null, 2) + '\n');
fs.writeFileSync(`${root}/answer-keys.json`, JSON.stringify(keys, null, 2) + '\n');
for (const paper of papers) console.log(`${paper.name}: ${paper.questions.length} questions, 100 answers, ${paper.issues.length} text review flags`);
