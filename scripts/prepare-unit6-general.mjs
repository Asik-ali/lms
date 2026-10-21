import fs from 'node:fs';
import { parseQuestion } from './prepare-tamil-import.mjs';

const root = 'imports/unit6-general';
const definitions = JSON.parse(fs.readFileSync(`${root}/definitions.json`, 'utf8'));
const papers = definitions.map(definition => {
  const answers = definition.groups.map(group => group.replace(/\s/g, ''));
  if (answers.some(group => group.length !== 10 || !/^[A-D]+$/.test(group))) throw new Error(`Invalid key groups: ${definition.source}: ${answers.map(g => g.length)}`);
  const text = fs.readFileSync(`${root}/source/${definition.source}`, 'utf8').replace(/Α/g, 'A').replace(/Β/g, 'B').replace(/^99-/gm, '99. -').replace(/^MUDRA வங்கியில்/gm, '34.MUDRA வங்கியில்').replace(/^([A-D])\)\./gm, '$1)').replace(/^(?:\(ID\)|ID\)|\[D\)|DI\))/gm, 'D)').replace(/^A (?=சாமுவேல்சன்|1 மட்டும்|20\.12)/gm, 'A) ').replace(/^a (?=ஒவ்வ)/gm, 'A) ').replace(/^C (?=அனைத்து)/gm, 'C) ');
  const repaired = text.replace(/^([AaBbCcDd]) (?=\S)/gm, '$1) ').replace(/^a,/gm, 'a)').replace(/^a\.\./gm, 'a.').replace(/^d’\./gm, 'd.').replace(/^d -/gm, 'd) ').replace(/^\(A(?=அறத்துப்பால்)/gm, '(A)');
  const candidates = [...repaired.matchAll(/^[ \t]*(\d{1,3})[ \t]*"?[.)][ \t]*/gm)];
  const boundaries = [];
  for (const candidate of candidates) {
    if (Number(candidate[1]) !== boundaries.length + 1) continue;
    const previous = boundaries.at(-1);
    if (previous && boundaries.length < 10) {
      const row = parseQuestion(repaired.slice(previous.index + previous[0].length, candidate.index), boundaries.length);
      if (['a','b','c','d'].filter(label => row?.[`option_${label}`]).length < 3) continue;
    }
    boundaries.push(candidate);
  }
  if (boundaries.length !== (definition.expectedCount || answers.length * 10)) throw new Error(`Wrong count: ${definition.source}: ${boundaries.length}`);
  const sequence = answers.join('');
  const issues = [];
  const questions = boundaries.map((boundary, index) => {
    let body = repaired.slice(boundary.index + boundary[0].length, boundaries[index + 1]?.index ?? repaired.length);
    if (definition.source === 'UNIT-6(full test).txt' && index === 53) body = body.replace(/^b\. ஜார்ஜ்/gm, 'd. ஜார்ஜ்');
    if (definition.source === 'unit 6 2.txt' && index === 25) body = body.replace(/^Q கூற்று/gm, 'C) கூற்று');
    const question = parseQuestion(body, index + 1);
    question.correct_answer = sequence[index] || null;
    for (const label of ['a','b','c','d']) if (!question[`option_${label}`]) issues.push({number: index + 1, issue: `Missing option ${label.toUpperCase()}; check source PDF`, source_text: question.source_text});
    return question;
  });
  return {...definition, language: 'Tamil', questions, issues};
});
fs.writeFileSync(`${root}/prepared.json`, JSON.stringify(papers, null, 2) + '\n');
fs.writeFileSync(`${root}/question-review.json`, JSON.stringify(papers.map(({name, issues}) => ({name, issues})), null, 2) + '\n');
for (const paper of papers) console.log(paper.source, paper.questions.length, paper.questions.filter(q => q.correct_answer).length + ' answers', JSON.stringify(paper.issues));
