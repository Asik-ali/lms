import { useState, useEffect } from 'react';
import { HelpCircle, Plus, X } from 'lucide-react';
import { getQuestions, addQuestion, getCategories } from '../../data/dynamicStore';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ question: '', type: 'Multiple Choice', category: '', difficulty: 'Easy' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setQuestions(await getQuestions());
    setCategories(await getCategories());
  }

  const handleAdd = async () => {
    const q = newQuestion.question.trim();
    if (!q || !newQuestion.category.trim()) return;
    if (!q.startsWith('http://') && !q.startsWith('https://')) return alert('Please enter a valid URL (starting with http:// or https://)');
    await addQuestion({ ...newQuestion });
    setQuestions(await getQuestions());
    setNewQuestion({ question: '', type: 'Multiple Choice', category: '', difficulty: 'Easy' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Question Link</th>
              <th className="table-header">Type</th>
              <th className="table-header">Category</th>
              <th className="table-header">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {questions.map(q => (
              <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell font-medium max-w-md truncate">
                  {q.question.startsWith('http://') || q.question.startsWith('https://') ? (
                    <a href={q.question} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate block">{q.question}</a>
                  ) : (
                    <span className="truncate block">{q.question}</span>
                  )}
                </td>
                <td className="table-cell">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{q.type}</span>
                </td>
                <td className="table-cell text-gray-500">{q.category}</td>
                <td className="table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${q.difficulty === 'Easy' ? 'bg-green-50 text-green-600' : q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{q.difficulty}</span>
                </td>
              </tr>
            ))}
            {questions.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">No questions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Question</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Question Link (Google Drive / URL)</label>
                <input type="url" value={newQuestion.question} onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })} className="input-field w-full" placeholder="https://drive.google.com/..." />
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
              <button onClick={handleAdd} className="btn-primary w-full">Add Question</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
