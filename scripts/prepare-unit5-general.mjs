import fs from 'node:fs';
import { parseQuestion } from './prepare-tamil-import.mjs';
import { repairPaperText } from './tamil-extraction.mjs';

const root = 'imports/unit5-general';
const definitions = [
  { source: 'unit 5 full.txt', name: 'அலகு 5 — முழுத் தேர்வு (பொருளாதாரம் மற்றும் தமிழ்நாடு நிர்வாகம்)', category: 'முழுத் தேர்வு', groups: ['ABADCD BADA','DCBACCDDCD','BACABBCCCB','BB DACADD DC','ABDADDADBA','ADBCBCBACC','BACCCBCCBC','CAB CDBCCBC','ADADDBABAA','CBDDCCBADB','BCDCDABACD','ABDBCDCDCC','ABAABC AAAB','ACDCCD ACAB','DCBBCBACDA','BBB DABADBB','BCAABB CACC','BBBDDACACD','CBCDDCDBCA','CBABCADBDC'] },
  { source: 'Unit 5 tn ans.txt', name: 'அலகு 5 — தமிழ்நாடு நிர்வாகம்', category: 'தமிழ்நாடு நிர்வாகம்', groups: ['DBBDCDCBAC','BDBBDCBDBB','AACCBADBAB','CBDBBC DCCB','ACDAADACCD','CCCCBCDADA','CBBACAADCB','DBDDCADCAC','DCDBCCBDAC','AACACCAACB'] },
  { source: 'unit 5 economy.txt', name: 'அலகு 5 — பொருளாதாரம்', category: 'பொருளாதாரம்', groups: ['DDCCCDAADC','DDDCBCCDCC','DDCCBBCBBB','BBADCCBBBC','ACADBCBDCB','CBCACACDCC','DCDBBAAAAB','ABDAABAADA','DDCD CDBAAD','BCDCCDABCD'] },
];
const papers = definitions.map(definition => {
  const answers = definition.groups.map(group => group.replace(/\s/g, ''));
  if (answers.some(group => group.length !== 10 || !/^[A-D]+$/.test(group))) throw new Error(`Invalid key groups: ${definition.source}: ${answers.map(g => g.length)}`);
  const text = fs.readFileSync(`${root}/source/${definition.source}`, 'utf8').replace(/Α/g, 'A').replace(/Β/g, 'B').replace(/^99-/gm, '99. -').replace(/^MUDRA வங்கியில்/gm, '34.MUDRA வங்கியில்').replace(/^([A-D])\)\./gm, '$1)').replace(/^(?:\(ID\)|ID\)|\[D\)|DI\))/gm, 'D)').replace(/^A (?=சாமுவேல்சன்|1 மட்டும்|20\.12)/gm, 'A) ').replace(/^a (?=ஒவ்வ)/gm, 'A) ').replace(/^C (?=அனைத்து)/gm, 'C) ');
  const candidates = [...text.matchAll(/^[ \t]*(\d{1,3})[ \t]*[.)][ \t]*/gm)];
  const boundaries = [];
  for (const candidate of candidates) {
    if (Number(candidate[1]) !== boundaries.length + 1) continue;
    const previous = boundaries.at(-1);
    if (previous && boundaries.length < 10) {
      const row = parseQuestion(text.slice(previous.index + previous[0].length, candidate.index), boundaries.length);
      if (['a','b','c','d'].filter(label => row?.[`option_${label}`]).length < 3) continue;
    }
    boundaries.push(candidate);
  }
  if (boundaries.length !== answers.length * 10) throw new Error(`Wrong count: ${definition.source}: ${boundaries.length}`);
  const sequence = answers.join('');
  const issues = [];
  const questions = boundaries.map((boundary, index) => {
    const question = parseQuestion(text.slice(boundary.index + boundary[0].length, boundaries[index + 1]?.index ?? text.length), index + 1);
    question.correct_answer = sequence[index];
    for (const label of ['a','b','c','d']) if (!question[`option_${label}`]) issues.push({number: index + 1, issue: `Missing option ${label.toUpperCase()}; check source PDF`, source_text: question.source_text});
    return question;
  });
  return {...definition, language: 'Tamil', questions, issues};
});
repairPaperText(papers);
fs.writeFileSync(`${root}/prepared.json`, JSON.stringify(papers, null, 2) + '\n');
fs.writeFileSync(`${root}/question-review.json`, JSON.stringify(papers.map(({name, issues}) => ({name, issues})), null, 2) + '\n');
for (const paper of papers) console.log(paper.source, paper.questions.length, JSON.stringify(paper.issues));
