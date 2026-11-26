import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import QuestionContent from '../../../src/components/common/QuestionContent.jsx';
import { localizeQuestion } from '../../../src/data/bilingualQuestions.js';
import '../../../src/index.css';

const row = {
  id: 1, question: '/unused',
  explanation: JSON.stringify({
    format: 'lms-bilingual-v1',
    tamil: { question: `${location.origin}/ta-question.webp` },
    textVersions: {
      english: { status: 'unreviewed', question: 'Find the ratio of 3 km to 300 m.', option_a: '3:10', option_b: '10:3', option_c: '1:10', option_d: '10:1' },
      tamil: { status: 'unreviewed', question: '3 கி.மீ-க்கும் 300 மீ-க்கும் இடையேயான விகிதத்தைக் காண்க.', option_a: '3:10', option_b: '10:3', option_c: '1:10', option_d: '10:1' },
    },
  }),
};
row.question = `${location.origin}/en-question.webp`;
export function Fixture() {
  const [language, setLanguage] = useState('English');
  return <main className="mx-auto max-w-3xl p-4">
    <button onClick={() => setLanguage(language === 'Tamil' ? 'English' : 'Tamil')}>Switch language</button>
    <QuestionContent question={localizeQuestion(row, language)} language={language} />
  </main>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
