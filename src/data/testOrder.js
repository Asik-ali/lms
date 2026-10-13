const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

function orderKey(test) {
  const name = String(test.name || '').normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s*\((?:tamil|english|english\s*[/&]\s*tamil|bilingual)\)\s*$/i, '').trim();
  const romanNumber = roman => {
    const values = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
    const letters = roman.toLowerCase().split('');
    const number = letters.reduce((sum, letter, index) => sum + (values[letter] < (values[letters[index + 1]] || 0) ? -values[letter] : values[letter]), 0);
    return number;
  };
  const normalized = name.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')
    .replace(/\btest\s+([ivxlcdm]+)\b/gi, (_, roman) => `Test ${romanNumber(roman)}`)
    .replace(/(^|[\s(])([ivxlcdm]+)\s*\)/gi, (_, prefix, roman) => `${prefix}${romanNumber(roman)})`)
    .replace(/\s*[-\u2013\u2014]\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const isFull = /\bfull\b|\u0bae\u0bc1\u0bb4\u0bc1/i.test(name);
  const type = isFull ? 2 : /\bsectional\b/i.test(name) ? 0 : 1;
  const language = String(test.language || '');
  const languageOrder = /english/i.test(language) && /tamil/i.test(language) ? 0 : /tamil/i.test(language) || /\(tamil\)/i.test(test.name || '') ? 2 : 1;
  return { normalized, type, languageOrder };
}

export function sortTests(tests) {
  return [...tests].sort((a, b) => {
    const left = orderKey(a), right = orderKey(b);
    return left.type - right.type || collator.compare(left.normalized, right.normalized)
      || left.languageOrder - right.languageOrder || Number(a.id) - Number(b.id);
  });
}
