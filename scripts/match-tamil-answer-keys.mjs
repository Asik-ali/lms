import fs from 'node:fs';
import path from 'node:path';

const mapping = {
  '01_இலக்கணம்_சொல்.txt': 'தமிழ் -இலக்கணம் ii) சொல்(2).txt',
  '02_இலக்கணம்_எழுத்து.txt': 'தமிழ் - இலக்கணம் i)எழுத்து(2).txt',
  '03_சொல்லகராதி_ii_iii.txt': 'அலகு 2. சொல்லகராதி (ii) (iii)(2).txt',
  '04_அலகு_II_முழு_தேர்வு.txt': 'தமிழ் அலகு 2 (முழு தேர்வு)(2).txt',
  '05_அலகு_III_எழுதும்_திறன்_i.txt': 'அலகு 3-எழுதும் திறன் ( i)(2).txt',
  '06_அலகு_II_எழுதும்_திறன்_ii.txt': 'அலகு 3 - எழுதும் திறன் (ii)(2).txt',
  '07_அலகு_III_எழுதும்_திறன்_full.txt': 'அலகு 3 முழு தேர்வு(2).txt',
  '08_அலகு_IV_முழு_தேர்வு.txt': 'அலகு 4-முழு தேர்வு(2).txt',
};
const directory = 'imports/tamil/answer-key-source';
const keys = JSON.parse(fs.readFileSync('imports/tamil/answer-keys.json', 'utf8'));
const unmatched = [];
for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.txt'))) {
  const text = fs.readFileSync(path.join(directory, file), 'utf8');
  const entries = [...text.matchAll(/^\s*(\d{1,3})[.]\s*([A-D])\s*$/gm)];
  if (entries.length !== 100 || entries.some((entry, index) => Number(entry[1]) !== index + 1)) throw new Error(`Invalid numbering in ${file}`);
  const target = mapping[file];
  if (!target) { unmatched.push({ file, reason: 'No matching question paper in the supplied nine-file archive', answers: entries.length }); continue; }
  if (!fs.existsSync(path.join('imports/tamil/source', target))) throw new Error(`Missing question paper ${target}`);
  const answers = entries.map(entry => entry[2]).join(' ');
  if (keys[target] && keys[target].answers !== answers) throw new Error(`Conflicting keys for ${target}`);
  keys[target] = { source: file, answers };
  console.log(`${file} -> ${target}: 100 answers verified`);
}
fs.writeFileSync('imports/tamil/answer-keys.json', JSON.stringify(keys, null, 2) + '\n');
fs.writeFileSync('imports/tamil/answer-key-match-report.json', JSON.stringify({ matchedPapers: Object.keys(keys).length, unmatched }, null, 2) + '\n');
console.log(`Matched keys for ${Object.keys(keys).length} tests; ${unmatched.length} extra key file retained without assigning it.`);
