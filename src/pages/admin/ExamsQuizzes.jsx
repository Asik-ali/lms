import { useState, useEffect } from 'react';
import { Plus, X, ChevronRight, Trash2, FolderOpen, FileText, HelpCircle, Settings, Clock, Target, Globe, BarChart3, Edit2 } from 'lucide-react';
import { getAllTestSeries, addTestSeries, setTestSeriesFree, deleteTestSeries, getCategoriesBySeries, addTestCategory, deleteTestCategory, getTestsByCategoryId, addTest, updateTest, deleteTest, getQuestionsByTestId, addQuestionToTest, deleteQuestion } from '../../data/dynamicStore';
import { showError, showSuccess } from '../../components/common/Toast';

const LEVELS = ['series', 'categories', 'tests', 'questions'];

export default function TestSeries() {
  const [level, setLevel] = useState('series');
  const [seriesList, setSeriesList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testsList, setTestsList] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentSeries, setCurrentSeries] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentTest, setCurrentTest] = useState(null);

  const [showAddSeries, setShowAddSeries] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddTest, setShowAddTest] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showEditTest, setShowEditTest] = useState(false);

  const [formSeries, setFormSeries] = useState({ name: '', description: '', is_free: false });
  const [formCategory, setFormCategory] = useState({ name: '', parent_id: '' });
  const [formTest, setFormTest] = useState({ name: '', description: '', duration: 90, total_marks: 270, difficulty: 'Moderate', language: 'English', instructions: '', syllabus: '' });
  const [formQuestion, setFormQuestion] = useState({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', explanation: '', type: 'Multiple Choice', difficulty: 'Easy' });

  useEffect(() => { loadSeries(); }, []);

  async function loadSeries() { setSeriesList(await getAllTestSeries()); }

  // Navigation
  function goSeries(s) { setCurrentSeries(s); setCurrentCategory(null); setCurrentTest(null); setQuestions([]); loadCategories(s.id); setLevel('categories'); }
  function goCategory(c) { setCurrentCategory(c); setCurrentTest(null); setQuestions([]); loadTests(c.id); setLevel('tests'); }
  function goTest(t) { setCurrentTest(t); loadQuestions(t.id); setLevel('questions'); }

  function goBack() {
    const idx = LEVELS.indexOf(level);
    if (idx <= 0) { setLevel('series'); setCurrentSeries(null); setCurrentCategory(null); setCurrentTest(null); }
    else if (idx === 1) { setLevel('series'); setCurrentSeries(null); setCurrentCategory(null); }
    else if (idx === 2) { setLevel('categories'); setCurrentCategory(null); setTestsList([]); }
    else if (idx === 3) { setLevel('tests'); setCurrentTest(null); setQuestions([]); }
  }

  // Load data
  async function loadCategories(seriesId) { setCategories(await getCategoriesBySeries(seriesId)); }
  async function loadTests(catId) { setTestsList(await getTestsByCategoryId(catId)); }
  async function loadQuestions(testId) { setQuestions(await getQuestionsByTestId(testId)); }

  // CRUD Series
  async function handleAddSeries() {
    if (!formSeries.name.trim()) return showError('Enter a series name.');
    try {
      await addTestSeries(formSeries);
      setFormSeries({ name: '', description: '', is_free: false });
      setShowAddSeries(false);
      await loadSeries();
      showSuccess('Series created.');
    } catch (e) { showError(e.message); }
  }
  async function handleDeleteSeries(id) {
    if (!confirm('Delete this series and all its content?')) return;
    await deleteTestSeries(id);
    if (currentSeries?.id === id) { setLevel('series'); setCurrentSeries(null); }
    await loadSeries();
    showSuccess('Series deleted.');
  }
  async function handleToggleFree(s) {
    try {
      await setTestSeriesFree(s.id, !s.is_free);
      await loadSeries();
      showSuccess(s.is_free ? 'Series set to assigned-only.' : 'Series set to free for all students.');
    } catch (e) { showError(e.message); }
  }

  // CRUD Categories
  async function handleAddCategory() {
    if (!formCategory.name.trim()) return showError('Enter a category name.');
    try {
      await addTestCategory({ series_id: currentSeries.id, name: formCategory.name, parent_id: formCategory.parent_id || null });
      setFormCategory({ name: '', parent_id: '' });
      setShowAddCategory(false);
      await loadCategories(currentSeries.id);
      showSuccess('Category created.');
    } catch (e) { showError(e.message); }
  }
  async function handleDeleteCategory(id) {
    if (!confirm('Delete this category and all its content?')) return;
    await deleteTestCategory(id);
    if (currentCategory?.id === id) { setLevel('categories'); setCurrentCategory(null); }
    await loadCategories(currentSeries.id);
    showSuccess('Category deleted.');
  }

  // CRUD Tests
  async function handleAddTest() {
    if (!formTest.name.trim()) return showError('Enter a test name.');
    try {
      await addTest({ category_id: currentCategory.id, ...formTest });
      setFormTest({ name: '', description: '', duration: 90, total_marks: 270, difficulty: 'Moderate', language: 'English', instructions: '', syllabus: '' });
      setShowAddTest(false);
      await loadTests(currentCategory.id);
      showSuccess('Test created.');
    } catch (e) { showError(e.message); }
  }
  async function handleDeleteTest(id) {
    if (!confirm('Delete this test and its questions?')) return;
    await deleteTest(id);
    if (currentTest?.id === id) { setLevel('tests'); setCurrentTest(null); }
    await loadTests(currentCategory.id);
    showSuccess('Test deleted.');
  }
  function openEditTest(t) {
    setFormTest({ name: t.name, description: t.description || '', duration: t.duration, total_marks: t.total_marks, difficulty: t.difficulty, language: t.language, instructions: t.instructions || '', syllabus: t.syllabus || '' });
    setCurrentTest(t);
    setShowEditTest(true);
  }
  async function handleUpdateTest() {
    if (!formTest.name.trim()) return showError('Enter a test name.');
    try {
      await updateTest(currentTest.id, formTest);
      setShowEditTest(false);
      setCurrentTest(null);
      await loadTests(currentCategory.id);
      showSuccess('Test updated.');
    } catch (e) { showError(e.message); }
  }

  // CRUD Questions
  async function handleAddQuestion() {
    const q = formQuestion.question.trim();
    if (!q) return showError('Enter a question.');
    if (!formQuestion.option_a.trim() || !formQuestion.option_b.trim()) return showError('At least options A and B are required.');
    if (!formQuestion.correct_answer) return showError('Select the correct answer.');
    try {
      await addQuestionToTest(currentTest.id, {
        question: q,
        type: formQuestion.type,
        category: currentSeries?.name || '',
        difficulty: formQuestion.difficulty,
        option_a: formQuestion.option_a,
        option_b: formQuestion.option_b,
        option_c: formQuestion.option_c,
        option_d: formQuestion.option_d,
        correct_answer: formQuestion.correct_answer,
        explanation: formQuestion.explanation,
      });
      setFormQuestion({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', explanation: '', type: 'Multiple Choice', difficulty: 'Easy' });
      setShowAddQuestion(false);
      await loadQuestions(currentTest.id);
      showSuccess('Question added.');
    } catch (e) { showError(e.message); }
  }
  async function handleDeleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    await deleteQuestion(id);
    await loadQuestions(currentTest.id);
    showSuccess('Question deleted.');
  }

  // Build breadcrumb
  const breadcrumb = [
    { label: 'Test Series', go: () => { setLevel('series'); setCurrentSeries(null); setCurrentCategory(null); setCurrentTest(null); } },
    currentSeries && { label: currentSeries.name, go: () => { setLevel('categories'); setCurrentCategory(null); setCurrentTest(null); } },
    currentCategory && { label: currentCategory.name, go: () => { setLevel('tests'); setCurrentTest(null); } },
    currentTest && { label: currentTest.name },
  ].filter(Boolean);

  // Get sub-categories for current category
  const subCategories = categories.filter(c => {
    if (!currentCategory) return !c.parent_id;
    return c.parent_id === currentCategory.id;
  });

  const topLevelCategories = categories.filter(c => !c.parent_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Test Series</h1>
        {level === 'series' && <button onClick={() => setShowAddSeries(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Series</button>}
        {level === 'categories' && <button onClick={() => setShowAddCategory(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Category</button>}
        {level === 'tests' && <button onClick={() => setShowAddTest(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Test</button>}
        {level === 'questions' && <button onClick={() => setShowAddQuestion(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Question</button>}
      </div>

      {breadcrumb.length > 1 && (
        <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              {b.go ? (
                <button onClick={b.go} className="hover:text-indigo-600 cursor-pointer">{b.label}</button>
              ) : (
                <span className="text-gray-900 dark:text-gray-100 font-medium">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Level: Series */}
      {level === 'series' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map(s => (
            <button key={s.id} onClick={() => goSeries(s)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-300" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{s.name}</p>
                  {s.description && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input type="checkbox" checked={!!s.is_free} onChange={() => handleToggleFree(s)} className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500" title="Visible to all students" />
                  <span className={s.is_free ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}>Free</span>
                </label>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteSeries(s.id); }} className="text-xs text-red-500 hover:text-red-700 cursor-pointer">Delete</button>
                {s.is_free && <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">All students</span>}
              </div>
            </button>
          ))}
          {seriesList.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-500"><FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>Create your first exam series (SSC CGL, SSC MTS, etc.)</p></div>
          )}
        </div>
      )}

      {/* Level: Categories */}
      {level === 'categories' && (
        <div className="space-y-4">
          {topLevelCategories.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Sections</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topLevelCategories.map(c => (
                  <button key={c.id} onClick={() => goCategory(c)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center"><FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-300" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{c.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Click to explore</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }} className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {topLevelCategories.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500"><FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No categories yet. Add sections like "Full Mock Tests", "Previous Year Papers", "Sectional Tests".</p></div>
          )}
        </div>
      )}

      {/* Level: Tests (and sub-categories) */}
      {level === 'tests' && (
        <div className="space-y-6">
          {subCategories.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Sub-categories</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subCategories.map(c => (
                  <button key={c.id} onClick={() => goCategory(c)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-amber-600 dark:text-amber-300" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{c.name}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }} className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Tests</p>
            <div className="space-y-3">
              {testsList.map(t => (
                <button key={t.id} onClick={() => goTest(t)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center"><HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-300" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{t.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t.duration} min</span>
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {t.total_marks} marks</span>
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {t.language}</span>
                        <span className={`px-2 py-0.5 rounded-full ${t.difficulty === 'Easy' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' : t.difficulty === 'Hard' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>{t.difficulty}</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); openEditTest(t); }} className="p-1 text-gray-400 dark:text-gray-500 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTest(t.id); }} className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </button>
              ))}
              {testsList.length === 0 && subCategories.length === 0 && (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500"><HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No tests yet. Add your first test.</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Level: Questions */}
      {level === 'questions' && currentTest && (
        <div className="space-y-4">
          <div className="card p-4 bg-gray-50 dark:bg-gray-800/60">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-100">{currentTest.name}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {currentTest.duration} min</span>
              <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {currentTest.total_marks} marks</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {currentTest.language}</span>
              <span>{questions.length} questions</span>
            </div>
            {currentTest.instructions && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{currentTest.instructions}</p>}
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                  <th className="table-header">#</th>
                  <th className="table-header">Question</th>
                  <th className="table-header">Options</th>
                  <th className="table-header">Answer</th>
                  <th className="table-header w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr key={q.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="table-cell text-gray-400 dark:text-gray-500">{i + 1}</td>
                    <td className="table-cell font-medium max-w-md"><span className="block line-clamp-2">{q.question}</span></td>
                    <td className="table-cell">
                      <div className="space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
                        <p className="truncate max-w-xs">A. {q.option_a}</p>
                        <p className="truncate max-w-xs">B. {q.option_b}</p>
                        {q.option_c && <p className="truncate max-w-xs">C. {q.option_c}</p>}
                        {q.option_d && <p className="truncate max-w-xs">D. {q.option_d}</p>}
                      </div>
                    </td>
                    <td className="table-cell"><span className="text-xs font-semibold bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">{q.correct_answer}</span></td>
                    <td className="table-cell"><button onClick={() => handleDeleteQuestion(q.id)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
                {questions.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400 dark:text-gray-500">No questions yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddSeries && (
        <Modal title="Add Test Series" onClose={() => setShowAddSeries(false)}>
          <div className="space-y-4">
            <div><label className="label">Series Name *</label><input value={formSeries.name} onChange={e => setFormSeries({ ...formSeries, name: e.target.value })} className="input-field w-full" placeholder="e.g. SSC CGL, SSC MTS" /></div>
            <div><label className="label">Description</label><input value={formSeries.description} onChange={e => setFormSeries({ ...formSeries, description: e.target.value })} className="input-field w-full" placeholder="Optional description" /></div>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60">
              <span>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Free for all students</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">Visible in the Free Test Series section to every signed-in student. Leave off to assign via student access.</span>
              </span>
              <input type="checkbox" checked={formSeries.is_free} onChange={e => setFormSeries({ ...formSeries, is_free: e.target.checked })} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500" />
            </label>
            <button onClick={handleAddSeries} className="btn-primary w-full">Create Series</button>
          </div>
        </Modal>
      )}

      {showAddCategory && (
        <Modal title={`Add Category to ${currentSeries?.name}`} onClose={() => setShowAddCategory(false)}>
          <div className="space-y-4">
            <div><label className="label">Category Name *</label><input value={formCategory.name} onChange={e => setFormCategory({ ...formCategory, name: e.target.value })} className="input-field w-full" placeholder="e.g. Full Mock Tests, Sectional Tests" /></div>
            {currentCategory && (
              <div><label className="label">Parent Category</label>
                <select value={formCategory.parent_id} onChange={e => setFormCategory({ ...formCategory, parent_id: e.target.value })} className="input-field w-full">
                  <option value="">None (top-level)</option>
                  {categories.filter(c => !c.parent_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <button onClick={handleAddCategory} className="btn-primary w-full">Create Category</button>
          </div>
        </Modal>
      )}

      {showAddTest && (
        <Modal title={`Add Test to ${currentCategory?.name}`} onClose={() => setShowAddTest(false)}>
          <div className="space-y-4">
            <div><label className="label">Test Name *</label><input value={formTest.name} onChange={e => setFormTest({ ...formTest, name: e.target.value })} className="input-field w-full" placeholder="e.g. Mock Test 01, SSC MTS 2025" /></div>
            <div><label className="label">Description</label><input value={formTest.description} onChange={e => setFormTest({ ...formTest, description: e.target.value })} className="input-field w-full" placeholder="Optional" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Duration (min)</label><input type="number" value={formTest.duration} onChange={e => setFormTest({ ...formTest, duration: Number(e.target.value) })} className="input-field w-full" /></div>
              <div><label className="label">Total Marks</label><input type="number" value={formTest.total_marks} onChange={e => setFormTest({ ...formTest, total_marks: Number(e.target.value) })} className="input-field w-full" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Difficulty</label>
                <select value={formTest.difficulty} onChange={e => setFormTest({ ...formTest, difficulty: e.target.value })} className="input-field w-full">
                  <option>Easy</option><option>Moderate</option><option>Hard</option><option>Exam-Level</option>
                </select>
              </div>
              <div><label className="label">Language</label>
                <select value={formTest.language} onChange={e => setFormTest({ ...formTest, language: e.target.value })} className="input-field w-full">
                  <option>English</option><option>Hindi</option><option>English / Hindi</option>
                </select>
              </div>
            </div>
            <div><label className="label">Instructions</label><textarea value={formTest.instructions} onChange={e => setFormTest({ ...formTest, instructions: e.target.value })} className="input-field w-full" rows={2} placeholder="Test rules..." /></div>
            <div><label className="label">Syllabus / Topics</label><textarea value={formTest.syllabus} onChange={e => setFormTest({ ...formTest, syllabus: e.target.value })} className="input-field w-full" rows={2} placeholder="Topics covered..." /></div>
            <button onClick={handleAddTest} className="btn-primary w-full">Create Test</button>
          </div>
        </Modal>
      )}

      {showAddQuestion && (
        <Modal title={`Add Question to ${currentTest?.name}`} onClose={() => setShowAddQuestion(false)}>
          <div className="space-y-4">
            <div><label className="label">Question *</label><textarea value={formQuestion.question} onChange={e => setFormQuestion({ ...formQuestion, question: e.target.value })} className="input-field w-full" rows={3} placeholder="Type the question here..." /></div>
            <div><label className="label">Option A *</label><input value={formQuestion.option_a} onChange={e => setFormQuestion({ ...formQuestion, option_a: e.target.value })} className="input-field w-full" placeholder="Option A" /></div>
            <div><label className="label">Option B *</label><input value={formQuestion.option_b} onChange={e => setFormQuestion({ ...formQuestion, option_b: e.target.value })} className="input-field w-full" placeholder="Option B" /></div>
            <div><label className="label">Option C</label><input value={formQuestion.option_c} onChange={e => setFormQuestion({ ...formQuestion, option_c: e.target.value })} className="input-field w-full" placeholder="Option C (optional)" /></div>
            <div><label className="label">Option D</label><input value={formQuestion.option_d} onChange={e => setFormQuestion({ ...formQuestion, option_d: e.target.value })} className="input-field w-full" placeholder="Option D (optional)" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Correct Answer *</label>
                <select value={formQuestion.correct_answer} onChange={e => setFormQuestion({ ...formQuestion, correct_answer: e.target.value })} className="input-field w-full">
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                </select>
              </div>
              <div><label className="label">Difficulty</label>
                <select value={formQuestion.difficulty} onChange={e => setFormQuestion({ ...formQuestion, difficulty: e.target.value })} className="input-field w-full">
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
            </div>
            <div><label className="label">Explanation (optional)</label><textarea value={formQuestion.explanation} onChange={e => setFormQuestion({ ...formQuestion, explanation: e.target.value })} className="input-field w-full" rows={2} placeholder="Explain the answer..." /></div>
            <button onClick={handleAddQuestion} className="btn-primary w-full">Add Question</button>
          </div>
        </Modal>
      )}

      {showEditTest && currentTest && (
        <Modal title={`Edit Test: ${currentTest.name}`} onClose={() => { setShowEditTest(false); setCurrentTest(null); }}>
          <div className="space-y-4">
            <div><label className="label">Test Name *</label><input value={formTest.name} onChange={e => setFormTest({ ...formTest, name: e.target.value })} className="input-field w-full" /></div>
            <div><label className="label">Description</label><input value={formTest.description} onChange={e => setFormTest({ ...formTest, description: e.target.value })} className="input-field w-full" placeholder="Optional" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Duration (min)</label><input type="number" value={formTest.duration} onChange={e => setFormTest({ ...formTest, duration: Number(e.target.value) })} className="input-field w-full" /></div>
              <div><label className="label">Total Marks</label><input type="number" value={formTest.total_marks} onChange={e => setFormTest({ ...formTest, total_marks: Number(e.target.value) })} className="input-field w-full" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Difficulty</label>
                <select value={formTest.difficulty} onChange={e => setFormTest({ ...formTest, difficulty: e.target.value })} className="input-field w-full">
                  <option>Easy</option><option>Moderate</option><option>Hard</option><option>Exam-Level</option>
                </select>
              </div>
              <div><label className="label">Language</label>
                <select value={formTest.language} onChange={e => setFormTest({ ...formTest, language: e.target.value })} className="input-field w-full">
                  <option>English</option><option>Hindi</option><option>English / Hindi</option>
                </select>
              </div>
            </div>
            <div><label className="label">Instructions</label><textarea value={formTest.instructions} onChange={e => setFormTest({ ...formTest, instructions: e.target.value })} className="input-field w-full" rows={2} placeholder="Test rules..." /></div>
            <div><label className="label">Syllabus / Topics</label><textarea value={formTest.syllabus} onChange={e => setFormTest({ ...formTest, syllabus: e.target.value })} className="input-field w-full" rows={2} placeholder="Topics covered..." /></div>
            <button onClick={handleUpdateTest} className="btn-primary w-full">Save Changes</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
