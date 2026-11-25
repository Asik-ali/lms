export function questionTranslation(row) {
  try {
    const value = JSON.parse(row.explanation || '');
    return value.format === 'lms-bilingual-v1' ? value : null;
  } catch { return null; }
}

export function localizeQuestion(row, language = 'English') {
  const translation = questionTranslation(row);
  if (!translation) return row;
  return {
    ...row,
    diagrams: translation.diagrams || [],
    ...(translation.extraOptions || {}),
    ...(language === 'Tamil' ? translation.tamil : {}),
    explanation: translation.explanation || '',
    number: translation.number,
  };
}

export function orderQuestions(rows) {
  return [...rows].sort((a, b) =>
    (questionTranslation(a)?.number ?? a.id) - (questionTranslation(b)?.number ?? b.id));
}

export function questionOptionLetters(row) {
  const localized = localizeQuestion(row);
  return localized?.option_e ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
}
