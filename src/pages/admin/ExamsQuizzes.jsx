import { useState, useEffect } from 'react';
import { Plus, X, ChevronRight, Trash2, FolderOpen, FileText, HelpCircle, Eye } from 'lucide-react';
import { getAllTestSeries, addTestSeries, deleteTestSeries, getTestsBySeriesId, addTest, deleteTest, getQuestionsByTestId, addQuestionToTest, deleteQuestion } from '../../data/dynamicStore';
import { showError, showSuccess } from '../../components/common/Toast';

export default function TestSeries() {
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showAddSeries, setShowAddSeries] = useState(false);
  const [showAddTest, setShowAddTest] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSeriesDesc, setNewSeriesDesc] = useState('');
  const [newTestName, setNewTestName] = useState('');
  const [newTestDesc, setNewTestDesc] = useState('');
  const [newQuestion, setNewQuestion] = useState({ question: '', type: 'Multiple Choice', difficulty: 'Easy' });

  useEffect(() => { loadSeries(); }, []);

  async function loadSeries() {
    const data = await getAllTestSeries();
    setSeries(data);
  }

  async function handleSelectSeries(s) {
    setSelectedSeries(s);
    setSelectedTest(null);
    setQuestions([]);
    setTests(await getTestsBySeriesId(s.id));
  }

  async function handleSelectTest(t) {
    setSelectedTest(t);
    setQuestions(await getQuestionsByTestId(t.id));
  }

  async function handleAddSeries() {
    const name = newSeriesName.trim();
    if (!name) return showError('Enter a series name.');
    try {
      await addTestSeries({ name, description: newSeriesDesc.trim() });
      setNewSeriesName('');
      setNewSeriesDesc('');
      setShowAddSeries(false);
      await loadSeries();
      showSuccess('Test series created.');
    } catch (e) {
      showError(e.message);
    }
  }

  async function handleDeleteSeries(id) {
    if (!confirm('Delete this series and all its tests?')) return;
    try {
      await deleteTestSeries(id);
      if (selectedSeries?.id === id) { setSelectedSeries(null); setSelectedTest(null); setTests([]); setQuestions([]); }
      await loadSeries();
      showSuccess('Series deleted.');
    } catch (e) {
      showError(e.message);
    }
  }

  async function handleAddTest() {
    const name = newTestName.trim();
    if (!name) return showError('Enter a test name.');
    try {
      await addTest({ series_id: selectedSeries.id, name, description: newTestDesc.trim() });
      setNewTestName('');
      setNewTestDesc('');
      setShowAddTest(false);
      setTests(await getTestsBySeriesId(selectedSeries.id));
      showSuccess('Test created.');
    } catch (e) {
      showError(e.message);
    }
  }

  async function handleDeleteTest(id) {
    if (!confirm('Delete this test and its questions?')) return;
    try {
      await deleteTest(id);
      if (selectedTest?.id === id) { setSelectedTest(null); setQuestions([]); }
      setTests(await getTestsBySeriesId(selectedSeries.id));
      showSuccess('Test deleted.');
    } catch (e) {
      showError(e.message);
    }
  }

  async function handleAddQuestion() {
    const q = newQuestion.question.trim();
    if (!q) return showError('Enter a question URL.');
    if (!q.startsWith('http://') && !q.startsWith('https://')) return showError('Please enter a valid URL.');
    try {
      await addQuestionToTest(selectedTest.id, {
        question: q,
        type: newQuestion.type,
        category: selectedSeries?.name || '',
        difficulty: newQuestion.difficulty,
      });
      setNewQuestion({ question: '', type: 'Multiple Choice', difficulty: 'Easy' });
      setShowAddQuestion(false);
      setQuestions(await getQuestionsByTestId(selectedTest.id));
      showSuccess('Question added.');
    } catch (e) {
      showError(e.message);
    }
  }

  async function handleDeleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteQuestion(id);
      setQuestions(await getQuestionsByTestId(selectedTest.id));
      showSuccess('Question deleted.');
    } catch (e) {
      showError(e.message);
    }
  }

  const breadcrumb = [
    { label: 'Test Series', onClick: () => { setSelectedSeries(null); setSelectedTest(null); setQuestions([]); setTests([]); } },
    selectedSeries && { label: selectedSeries.name, onClick: () => { setSelectedTest(null); setQuestions([]); } },
    selectedTest && { label: selectedTest.name },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Test Series</h1>
        {!selectedSeries && (
          <button onClick={() => setShowAddSeries(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Series
          </button>
        )}
        {selectedSeries && !selectedTest && (
          <button onClick={() => setShowAddTest(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Test
          </button>
        )}
        {selectedTest && (
          <button onClick={() => setShowAddQuestion(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Question
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
            <button key={s.id} onClick={() => handleSelectSeries(s)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                  {s.description && <p className="text-xs text-gray-500 truncate">{s.description}</p>}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteSeries(s.id); }} className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">Delete</button>
            </button>
          ))}
          {series.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No test series yet. Create your first exam category (e.g. SSC CGL, SSC CHSL).</p>
            </div>
          )}
        </div>
      )}

      {selectedSeries && !selectedTest && (
        <div className="space-y-4">
          {tests.map(t => (
            <button key={t.id} onClick={() => handleSelectTest(t)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  {t.description && <p className="text-xs text-gray-500 truncate">{t.description}</p>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteTest(t.id); }} className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
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
      )}

      {selectedTest && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{questions.length} questions in {selectedTest.name}</p>
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

      {showAddSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Test Series</h2>
              <button onClick={() => setShowAddSeries(false)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Series Name *</label>
                <input type="text" value={newSeriesName} onChange={e => setNewSeriesName(e.target.value)} className="input-field w-full" placeholder="e.g. SSC CGL, SSC CHSL, SSC MTS" />
              </div>
              <div>
                <label className="label">Description</label>
                <input type="text" value={newSeriesDesc} onChange={e => setNewSeriesDesc(e.target.value)} className="input-field w-full" placeholder="Optional description" />
              </div>
              <button onClick={handleAddSeries} className="btn-primary w-full">Create Series</button>
            </div>
          </div>
        </div>
      )}

      {showAddTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Test to {selectedSeries?.name}</h2>
              <button onClick={() => setShowAddTest(false)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Test Name *</label>
                <input type="text" value={newTestName} onChange={e => setNewTestName(e.target.value)} className="input-field w-full" placeholder="e.g. SSC CGL Tier-1 2024" />
              </div>
              <div>
                <label className="label">Description</label>
                <input type="text" value={newTestDesc} onChange={e => setNewTestDesc(e.target.value)} className="input-field w-full" placeholder="Optional description" />
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
