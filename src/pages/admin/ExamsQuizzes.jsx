import { useState, useEffect } from 'react';
import { HelpCircle, Plus, X, ChevronRight, Trash2, FolderOpen, FileText } from 'lucide-react';
import { getTestSeries, getTestsBySeries, getQuestionsByTest, addQuestion, deleteQuestion, getCategories } from '../../data/dynamicStore';
import { showError, showSuccess } from '../../components/common/Toast';

export default function TestSeries() {
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddTest, setShowAddTest] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [newTestCategory, setNewTestCategory] = useState('');
  const [newQuestion, setNewQuestion] = useState({ question: '', type: 'Multiple Choice', difficulty: 'Easy' });

  useEffect(() => { loadSeries(); loadCategories(); }, []);

  async function loadSeries() {
    setSeries(await getTestSeries());
  }

  async function loadCategories() {
    setCategories(await getCategories());
  }

  async function handleSelectSeries(s) {
    setSelectedSeries(s);
    setSelectedTest(null);
    setQuestions([]);
    setTests(await getTestsBySeries(s.name));
  }

  async function handleSelectTest(t) {
    setSelectedTest(t);
    setQuestions(await getQuestionsByTest(selectedSeries.name, t.name));
  }

  const handleAddTest = async () => {
    const name = newTestName.trim();
    if (!name) return showError('Enter a test name.');
    const cat = newTestCategory || selectedSeries?.name || '';
    await addQuestion({
      question: name,
      type: 'Test',
      category: cat,
      difficulty: 'Easy',
      test_name: name,
    });
    setNewTestName('');
    setNewTestCategory('');
    setShowAddTest(false);
    if (selectedSeries) {
      setTests(await getTestsBySeries(selectedSeries.name));
    }
    await loadSeries();
    showSuccess('Test added.');
  };

  const handleAddQuestion = async () => {
    const q = newQuestion.question.trim();
    if (!q) return showError('Enter a question URL.');
    if (!q.startsWith('http://') && !q.startsWith('https://')) return showError('Please enter a valid URL.');
    await addQuestion({
      question: q,
      type: newQuestion.type,
      category: selectedSeries?.name || '',
      difficulty: newQuestion.difficulty,
      test_name: selectedTest?.name || '',
    });
    setNewQuestion({ question: '', type: 'Multiple Choice', difficulty: 'Easy' });
    setShowAddQuestion(false);
    if (selectedTest) {
      setQuestions(await getQuestionsByTest(selectedSeries.name, selectedTest.name));
    }
    await loadSeries();
    showSuccess('Question added.');
  };

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Delete this question?')) return;
    await deleteQuestion(id);
    if (selectedTest) {
      setQuestions(await getQuestionsByTest(selectedSeries.name, selectedTest.name));
    }
    await loadSeries();
    showSuccess('Question deleted.');
  };

  const breadcrumb = [
    { label: 'Test Series', onClick: () => { setSelectedSeries(null); setSelectedTest(null); setQuestions([]); } },
    selectedSeries && { label: selectedSeries.name, onClick: () => { setSelectedTest(null); setQuestions([]); } },
    selectedTest && { label: selectedTest.name },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Test Series</h1>
        {selectedSeries && (
          <button onClick={() => setShowAddTest(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Test
          </button>
        )}
      </div>

      {breadcrumb.length > 1 && (
        <nav className="flex items-center gap-1 text-sm text-gray-500">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              {b.onClick ? (
                <button onClick={b.onClick} className="hover:text-indigo-600 cursor-pointer">{b.label}</button>
              ) : (
                <span className="text-gray-900 font-medium">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {!selectedSeries && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {series.map(s => (
            <button key={s.name} onClick={() => handleSelectSeries(s)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.count} questions</p>
                </div>
              </div>
            </button>
          ))}
          {series.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No test series yet. Add your first test to get started.</p>
            </div>
          )}
        </div>
      )}

      {selectedSeries && !selectedTest && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map(t => (
              <button key={t.name} onClick={() => handleSelectTest(t)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.count} questions</p>
                  </div>
                </div>
              </button>
            ))}
            {tests.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No tests in this series yet. Click "Add Test" to create one.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTest && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{questions.length} questions in {selectedTest.name}</p>
            <button onClick={() => setShowAddQuestion(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="table-header">Question Link</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Difficulty</th>
                  <th className="table-header w-20">Actions</th>
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
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${q.difficulty === 'Easy' ? 'bg-green-50 text-green-600' : q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{q.difficulty}</span>
                    </td>
                    <td className="table-cell">
                      <button onClick={() => handleDeleteQuestion(q.id)} className="p-1 text-gray-400 hover:text-red-600 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {questions.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">No questions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Test</h2>
              <button onClick={() => setShowAddTest(false)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Test Name</label>
                <input type="text" value={newTestName} onChange={e => setNewTestName(e.target.value)} className="input-field w-full" placeholder="e.g. SSC MTS Test 1" />
              </div>
              <div>
                <label className="label">Category / Series</label>
                <select value={newTestCategory || selectedSeries?.name || ''} onChange={e => setNewTestCategory(e.target.value)} className="input-field w-full">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={handleAddTest} className="btn-primary w-full">Create Test</button>
            </div>
          </div>
        </div>
      )}

      {showAddQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Question to {selectedTest?.name}</h2>
              <button onClick={() => setShowAddQuestion(false)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-5 h-5" /></button>
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
              <button onClick={handleAddQuestion} className="btn-primary w-full">Add Question</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
