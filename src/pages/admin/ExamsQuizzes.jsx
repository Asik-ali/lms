import { useState, useEffect } from 'react';
import { BookOpen, HelpCircle, Trophy, Clock, Award, Plus, X } from 'lucide-react';
import { getQuestions, addQuestion, getQuizzes, addQuiz, getStudents, getCourses, getCategories } from '../../data/dynamicStore';

export default function ExamsQuizzes() {
  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState('quizzes');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setQuestions(await getQuestions());
    setQuizzes(await getQuizzes());
    setStudents(await getStudents());
    setCourses(await getCourses());
    setCategories(await getCategories());
  }

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ question: '', type: 'Multiple Choice', category: '', difficulty: 'Easy' });

  const [showQuizForm, setShowQuizForm] = useState(false);
  const [newQuiz, setNewQuiz] = useState({ title: '', course: '', totalMarks: '', duration: '', status: 'Draft' });

  const handleAddQuestion = async () => {
    if (!newQuestion.question.trim() || !newQuestion.category.trim()) return;
    await addQuestion({ ...newQuestion });
    setQuestions(await getQuestions());
    setNewQuestion({ question: '', type: 'Multiple Choice', category: '', difficulty: 'Easy' });
    setShowQuestionForm(false);
  };

  const handleAddQuiz = async () => {
    if (!newQuiz.title.trim() || !newQuiz.course.trim() || !newQuiz.totalMarks || !newQuiz.duration.trim()) return;
    await addQuiz({ ...newQuiz, totalMarks: Number(newQuiz.totalMarks), questions: 0 });
    setQuizzes(await getQuizzes());
    setNewQuiz({ title: '', course: '', totalMarks: '', duration: '', status: 'Draft' });
    setShowQuizForm(false);
  };

  const stats = [
    { icon: HelpCircle, label: 'Total Questions', value: questions.length, color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Trophy, label: 'Total Quizzes', value: quizzes.length, color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: Award, label: 'Avg Score', value: '78%', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Clock, label: 'Upcoming', value: 'This Week', color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Exams & Quizzes</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowQuizForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Quiz
          </button>
          <button onClick={() => setShowQuestionForm(true)} className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`${s.bg} p-4 rounded-xl border border-gray-200`}>
            <div className="flex items-center gap-3">
              <div className={`${s.color} p-2 bg-white rounded-lg shadow-sm`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button onClick={() => setTab('quizzes')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'quizzes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Quizzes</button>
          <button onClick={() => setTab('questions')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'questions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Question Bank</button>
        </div>
      </div>

      {tab === 'quizzes' && (
        <div className="grid grid-cols-3 gap-4">
          {quizzes.map(q => (
            <div key={q.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <span className={`badge ${q.status === 'Published' ? 'badge-success' : 'badge-warning'}`}>{q.status}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{q.title}</h3>
              <div className="mt-2 text-sm text-gray-500 space-y-1">
                <p>Course: {q.course}</p>
                <p>Questions: {q.questions}</p>
                <p>Duration: {q.duration}</p>
                <p>Total Marks: {q.totalMarks}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'questions' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="table-header">Question</th>
                <th className="table-header">Type</th>
                <th className="table-header">Category</th>
                <th className="table-header">Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {questions.map(q => (
                <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="table-cell font-medium max-w-md truncate">{q.question}</td>
                  <td className="table-cell">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{q.type}</span>
                  </td>
                  <td className="table-cell text-gray-500">{q.category}</td>
                  <td className="table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${q.difficulty === 'Easy' ? 'bg-green-50 text-green-600' : q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{q.difficulty}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showQuestionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Question</h2>
              <button onClick={() => setShowQuestionForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Question</label>
                <textarea value={newQuestion.question} onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })} className="input-field w-full" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select value={newQuestion.type} onChange={e => setNewQuestion({ ...newQuestion, type: e.target.value })} className="input-field w-full">
                    <option>Multiple Choice</option>
                    <option>Essay</option>
                    <option>True/False</option>
                    <option>Short Answer</option>
                  </select>
                </div>
                <div>
                  <label className="label">Difficulty</label>
                  <select value={newQuestion.difficulty} onChange={e => setNewQuestion({ ...newQuestion, difficulty: e.target.value })} className="input-field w-full">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Category</label>
                <select value={newQuestion.category} onChange={e => setNewQuestion({ ...newQuestion, category: e.target.value })} className="input-field w-full">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={handleAddQuestion} className="btn-primary w-full">Add Question</button>
            </div>
          </div>
        </div>
      )}

      {showQuizForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create Quiz</h2>
              <button onClick={() => setShowQuizForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input value={newQuiz.title} onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })} className="input-field w-full" placeholder="Quiz title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Course</label>
                  <select value={newQuiz.course} onChange={e => setNewQuiz({ ...newQuiz, course: e.target.value })} className="input-field w-full">
                    <option value="">Select course</option>
                    {courses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select value={newQuiz.status} onChange={e => setNewQuiz({ ...newQuiz, status: e.target.value })} className="input-field w-full">
                    <option>Draft</option>
                    <option>Published</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Total Marks</label>
                  <input type="number" value={newQuiz.totalMarks} onChange={e => setNewQuiz({ ...newQuiz, totalMarks: e.target.value })} className="input-field w-full" placeholder="100" />
                </div>
                <div>
                  <label className="label">Duration</label>
                  <input value={newQuiz.duration} onChange={e => setNewQuiz({ ...newQuiz, duration: e.target.value })} className="input-field w-full" placeholder="e.g. 30 min" />
                </div>
              </div>
              <button onClick={handleAddQuiz} className="btn-primary w-full">Create Quiz</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
