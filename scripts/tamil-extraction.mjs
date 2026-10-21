export function repairTamil(text, conservative = false) {
  // The source font duplicates the base before pre-base vowel glyphs.
  // Preserve consonants bearing pulli and deliberate spelling exercises.
  let value = text.replace(/([\u0b95-\u0bb9])[ \t]*\r?\n[ \t]*\1([ொௌ])/g, '$1$2');
  if (!conservative) value = value.replace(/([\u0b95-\u0bb9])\1([ொோௌ])/g, '$1$2');
  return value;
}

export function repairPaperText(papers) {
  for (const paper of papers) for (const question of paper.questions) {
    const spellingExercise = /பிழை|பிழையற்ற|சந்தி|சரியான\s+சொல்லை|சரியான\s+சொற்களை/.test(question.question);
    for (const field of ['question', 'option_a', 'option_b', 'option_c', 'option_d']) {
      question[field] = repairTamil(question[field], field !== 'question' && spellingExercise);
    }
  }
  return papers;
}
