export default function QuestionLanguageSwitch({ value, onChange }) {
  return (
    <div className="question-language-control">
      <span className="text-xs font-medium text-navy-200">Language</span>
      <div className="question-language-switch" role="group" aria-label="Question language">
        {['English', 'Tamil'].map(language => (
          <button key={language} type="button" aria-pressed={value === language}
            onClick={() => onChange(language)} lang={language === 'Tamil' ? 'ta' : 'en'}>
            {language === 'Tamil' ? 'தமிழ்' : 'English'}
          </button>
        ))}
      </div>
    </div>
  );
}
