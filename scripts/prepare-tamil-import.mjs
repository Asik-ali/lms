import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const labels = ['A', 'B', 'C', 'D'];
const normalizeLabel = label => ({ 'А': 'A', 'а': 'A', 'В': 'B', 'в': 'B', 'С': 'C', 'с': 'C', 'Ｄ': 'D' }[label] || label.toUpperCase());
export function parseQuestion(body, number) {
  const tokens = [...body.matchAll(/^[ \t]*(?:\([ \t]*([A-Da-dАаВвСсＤ])[ \t]*\)|([A-Da-dАаВвСсＤ])[ \t]*[).])[ \t]*/gm)];
  let chosen = null;
  for (let index = 0; index + 4 <= tokens.length; index++) {
    const group = tokens.slice(index, index + 4);
    if (new Set(group.map(token => normalizeLabel(token[1] || token[2]))).size === 4) chosen = group;
  }
  if (!chosen) chosen = tokens.slice(-4);
  const question = body.slice(0, chosen[0]?.index ?? body.length).trim();
  const row = { number, question, correct_answer: null, source_text: body.trim(), option_a: '', option_b: '', option_c: '', option_d: '' };
  chosen.forEach((token, index) => {
    const label = normalizeLabel(token[1] || token[2]);
    row[`option_${label.toLowerCase()}`] = body.slice(token.index + token[0].length, chosen[index + 1]?.index ?? body.length).trim();
  });
  if (!question) return null;
  return row;
}

export function parsePaper(source) {
  const text = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/^(?:--- Page \d+ ---|=+ PAGE \d+ =+)\s*$/gm, '');
  const candidates = [...text.matchAll(/^[ \t]*(\d{1,3})[.)][ \t]*/gm)];
  const boundaries = [];
  let expected = 1;
  for (const candidate of candidates) {
    if (Number(candidate[1]) !== expected) continue;
    const previous = boundaries.at(-1);
    if (previous && expected <= 10) {
      const previousQuestion = parseQuestion(text.slice(previous.index + previous[0].length, candidate.index), expected - 1);
      if (!previousQuestion || labels.filter(label => previousQuestion[`option_${label.toLowerCase()}`]).length < 3) continue;
    }
    boundaries.push(candidate);
    expected++;
  }
  const questions = boundaries.map((boundary, index) => {
    const body = text.slice(boundary.index + boundary[0].length, boundaries[index + 1]?.index ?? text.length);
    const row = parseQuestion(body, index + 1);
    if (!row) throw new Error(`Cannot safely parse question ${index + 1}`);
    return row;
  });
  if (questions.length !== 100) throw new Error(`Expected 100 questions; found ${questions.length}`);
  return questions;
}

function category(name) {
  if (/அலகு 2/.test(name)) return 'அலகு 2 — சொல்லகராதி';
  if (/அலகு 3/.test(name)) return 'அலகு 3 — எழுதும் திறன்';
  if (/அலகு 4/.test(name)) return 'அலகு 4';
  return 'அலகு 1 — இலக்கணம்';
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceDirectory = 'imports/tamil/source';
  const answerKeys = fs.existsSync('imports/tamil/answer-keys.json') ? JSON.parse(fs.readFileSync('imports/tamil/answer-keys.json', 'utf8')) : {};
  const papers = fs.readdirSync(sourceDirectory).filter(name => name.endsWith('.txt')).sort().map(source => {
    const raw = fs.readFileSync(path.join(sourceDirectory, source), 'utf8');
    const questions = parsePaper(raw);
    const key = answerKeys[source];
    if (key) {
      const answers = key.answers.trim().split(/\s+/);
      if (answers.length !== questions.length || answers.some(answer => !/^[A-D]$/.test(answer))) throw new Error(`Invalid answer key: ${source}`);
      questions.forEach((question, index) => { question.correct_answer = answers[index]; });
    }
    const issues = questions.flatMap(question => {
      const text = [question.question, question.option_a, question.option_b, question.option_c, question.option_d].join('\n');
      const flags = [];
      for (const label of labels) if (!question[`option_${label.toLowerCase()}`]) flags.push(`Option ${label} is missing or has an unreadable label in the supplied file`);
      if (/ககோ|பபோ|சசோ|லலோ|ம மொழி|ச சொல்|ப பொரு|ததோ|கஎதிர்/.test(text)) flags.push('Possible Tamil text extraction error; check original PDF');
      if ([question.option_a, question.option_b, question.option_c, question.option_d].some((option, index, options) => options.indexOf(option) !== index)) flags.push('Repeated option text; check source');
      return flags.map(issue => ({ number: question.number, issue }));
    });
    return { source, name: source.replace(/\(2\)\.txt$/, '').trim(), category: category(source), language: 'Tamil', questions, issues, answerKeyStatus: key ? 'User-provided; 100 answers matched by question number' : 'Missing from supplied files' };
  });
  if (papers.length !== 10) throw new Error(`Expected 10 papers; found ${papers.length}`);
  fs.writeFileSync('imports/tamil/prepared.json', JSON.stringify(papers, null, 2) + '\n');
  fs.writeFileSync('imports/tamil/question-review.json', JSON.stringify({ papers: papers.map(({ source, issues, questions }) => ({ source, questionCount: questions.length, missingAnswers: questions.filter(question => !question.correct_answer).length, issues })) }, null, 2) + '\n');
  for (const paper of papers) console.log(`${paper.source}: ${paper.questions.length} questions; ${paper.issues.length} text review flags; ${paper.questions.filter(question => question.correct_answer).length} answers`);
}
