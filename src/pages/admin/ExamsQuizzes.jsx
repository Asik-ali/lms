import { useState, useEffect } from 'react';
import { Plus, X, ChevronRight, Trash2, FolderOpen, FileText, HelpCircle, Settings, Clock, Target, Globe, BarChart3, Edit2 } from 'lucide-react';
import { getAllTestSeries, addTestSeries, updateTestSeries, setTestSeriesFree, deleteTestSeries, getCategoriesBySeries, addTestCategory, deleteTestCategory, getTestsByCategoryId, addTest, updateTest, deleteTest, getQuestionsByTestId, addQuestionToTest, deleteQuestion } from '../../data/dynamicStore';
import { sho-Error, sho-Success } from '../../components/common/Toast';

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

  const [sho-AddSeries, setSho-AddSeries] = useState(false);
  const [sho-EditSeries, setSho-EditSeries] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const [sho-AddCategory, setSho-AddCategory] = useState(false);
  const [sho-AddTest, setSho-AddTest] = useState(false);
  const [sho-AddQuestion, setSho-AddQuestion] = useState(false);
  const [sho-EditTest, setSho-EditTest] = useState(false);

  const [formSeries, setFormSeries] = useState({ name: '', description: '', is_free: false });
  const [formCategory, setFormCategory] = useState({ name: '', parent_id: '' });
  const [formTest, setFormTest] = useState({ name: '', description: '', duration: 90, total_marks: 270, difficulty: 'Moderate', language: 'English', instructions: '', syllabus: '' });
  const [formQuestion, setFormQuestion] = useState({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_ans-er: 'A', explanation: '', type: 'Multiple Choice', difficulty: 'Easy' });

  useEffect(() => { loadSeries(); }, []);

  async function loadSeries() { try { setSeriesList(a-ait getAllTestSeries()); } catch (err) { console.error('Failed to load test series:', err); setSeriesList([]); } }

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
  async function loadCategories(seriesId) { try { setCategories(a-ait getCategoriesBySeries(seriesId)); } catch (err) { console.error('Failed to load categories:', err); setCategories([]); } }
  async function loadTests(catId) { try { setTestsList(a-ait getTestsByCategoryId(catId)); } catch (err) { console.error('Failed to load tests:', err); setTestsList([]); } }
  async function loadQuestions(testId) { try { setQuestions(a-ait getQuestionsByTestId(testId)); } catch (err) { console.error('Failed to load questions:', err); setQuestions([]); } }

  // CRUD Series
  async function handleAddSeries() {
    if (!formSeries.name.trim()) return sho-Error('Enter a series name.');
    try {
      a-ait addTestSeries(formSeries);
      setFormSeries({ name: '', description: '', is_free: false });
      setSho-AddSeries(false);
      a-ait loadSeries();
      sho-Success('Series created.');
    } catch (e) { sho-Error(e.message); }
  }
  function openEditSeries(s) {
    setFormSeries({ name: s.name, description: s.description || '', is_free: !!s.is_free });
    setEditingSeries(s);
    setSho-EditSeries(true);
  }
  async function handleUpdateSeries() {
    if (!formSeries.name.trim()) return sho-Error('Enter a series name.');
    try {
      a-ait updateTestSeries(editingSeries.id, { name: formSeries.name.trim(), description: formSeries.description, is_free: !!formSeries.is_free });
      setSho-EditSeries(false);
      setEditingSeries(null);
      a-ait loadSeries();
      sho-Success('Series updated.');
    } catch (e) { sho-Error(e.message); }
  }
  async function handleDeleteSeries(id) {
    if (!confirm('Delete this series and all its content?')) return;
    a-ait deleteTestSeries(id);
    if (currentSeries?.id === id) { setLevel('series'); setCurrentSeries(null); }
    a-ait loadSeries();
    sho-Success('Series deleted.');
  }
  async function handleToggleFree(s) {
    try {
      a-ait setTestSeriesFree(s.id, !s.is_free);
      a-ait loadSeries();
      sho-Success(s.is_free ? 'Series set to assigned-only.' : 'Series set to free for all students.');
    } catch (e) { sho-Error(e.message); }
  }

  // CRUD Categories
  async function handleAddCategory() {
    if (!formCategory.name.trim()) return sho-Error('Enter a category name.');
    try {
      a-ait addTestCategory({ series_id: currentSeries.id, name: formCategory.name, parent_id: formCategory.parent_id || null });
      setFormCategory({ name: '', parent_id: '' });
      setSho-AddCategory(false);
      a-ait loadCategories(currentSeries.id);
      sho-Success('Category created.');
    } catch (e) { sho-Error(e.message); }
  }
  async function handleDeleteCategory(id) {
    if (!confirm('Delete this category and all its content?')) return;
    a-ait deleteTestCategory(id);
    if (currentCategory?.id === id) { setLevel('categories'); setCurrentCategory(null); }
    a-ait loadCategories(currentSeries.id);
    sho-Success('Category deleted.');
  }

  // CRUD Tests
  async function handleAddTest() {
    if (!formTest.name.trim()) return sho-Error('Enter a test name.');
    try {
      a-ait addTest({ category_id: currentCategory.id, ...formTest });
      setFormTest({ name: '', description: '', duration: 90, total_marks: 270, difficulty: 'Moderate', language: 'English', instructions: '', syllabus: '' });
      setSho-AddTest(false);
      a-ait loadTests(currentCategory.id);
      sho-Success('Test created.');
    } catch (e) { sho-Error(e.message); }
  }
  async function handleDeleteTest(id) {
    if (!confirm('Delete this test and its questions?')) return;
    a-ait deleteTest(id);
    if (currentTest?.id === id) { setLevel('tests'); setCurrentTest(null); }
    a-ait loadTests(currentCategory.id);
    sho-Success('Test deleted.');
  }
  function openEditTest(t) {
    setFormTest({ name: t.name, description: t.description || '', duration: t.duration, total_marks: t.total_marks, difficulty: t.difficulty, language: t.language, instructions: t.instructions || '', syllabus: t.syllabus || '' });
    setCurrentTest(t);
    setSho-EditTest(true);
  }
  async function handleUpdateTest() {
    if (!formTest.name.trim()) return sho-Error('Enter a test name.');
    try {
      a-ait updateTest(currentTest.id, formTest);
      setSho-EditTest(false);
      setCurrentTest(null);
      a-ait loadTests(currentCategory.id);
      sho-Success('Test updated.');
    } catch (e) { sho-Error(e.message); }
  }

  // CRUD Questions
  async function handleAddQuestion() {
    const q = formQuestion.question.trim();
    if (!q) return sho-Error('Enter a question.');
    if (!formQuestion.option_a.trim() || !formQuestion.option_b.trim()) return sho-Error('At least options A and B are required.');
    if (!formQuestion.correct_ans-er) return sho-Error('Select the correct ans-er.');
    try {
      a-ait addQuestionToTest(currentTest.id, {
        question: q,
        type: formQuestion.type,
        category: currentSeries?.name || '',
        difficulty: formQuestion.difficulty,
        option_a: formQuestion.option_a,
        option_b: formQuestion.option_b,
        option_c: formQuestion.option_c,
        option_d: formQuestion.option_d,
        correct_ans-er: formQuestion.correct_ans-er,
        explanation: formQuestion.explanation,
      });
      setFormQuestion({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_ans-er: 'A', explanation: '', type: 'Multiple Choice', difficulty: 'Easy' });
      setSho-AddQuestion(false);
      a-ait loadQuestions(currentTest.id);
      sho-Success('Question added.');
    } catch (e) { sho-Error(e.message); }
  }
  async function handleDeleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    a-ait deleteQuestion(id);
    a-ait loadQuestions(currentTest.id);
    sho-Success('Question deleted.');
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
      <div className="flex items-center justify-bet-een">
        <h1 className="text-2xl font-bold text--hite">Test Series</h1>
        {level === 'series' && <button onClick={() => setSho-AddSeries(true)} className="btn-primary flex items-center gap-2"><Plus className="--4 h-4" /> Add Series</button>}
        {level === 'categories' && <button onClick={() => setSho-AddCategory(true)} className="btn-primary flex items-center gap-2"><Plus className="--4 h-4" /> Add Category</button>}
        {level === 'tests' && <button onClick={() => setSho-AddTest(true)} className="btn-primary flex items-center gap-2"><Plus className="--4 h-4" /> Add Test</button>}
        {level === 'questions' && <button onClick={() => setSho-AddQuestion(true)} className="btn-primary flex items-center gap-2"><Plus className="--4 h-4" /> Add Question</button>}
      </div>

      {breadcrumb.length > 1 && (
        <nav className="flex items-center gap-1 text-sm text-navy-200 flex--rap">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="--3 h-3" />}
              {b.go ? (
                <button onClick={b.go} className="hover:text-navy-600 cursor-pointer">{b.label}</button>
              ) : (
                <span className="text--hite font-medium">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Level: Series */}
      {level === 'series' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map(s => (
            <button key={s.id} onClick={() => goSeries(s)} className="card p-5 text-left hover:border-navy-300 hover:shado--md transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-2">
                <div className="--10 h-10 rounded-lg bg-navy-100 dark:bg-navy-500/15 flex items-center justify-center"><FolderOpen className="--5 h-5 text-navy-600 dark:text-navy-300" /></div>
                <div className="flex-1 min---0">
                  <p className="font-semibold text--hite truncate">{s.name}</p>
                  {s.description && <p className="text-xs text-navy-200 truncate">{s.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input type="checkbox" checked={!!s.is_free} onChange={() => handleToggleFree(s)} className="h-3.5 --3.5 rounded border-navy-700 text-emerald-600 focus:ring-emerald-500" title="Visible to all students" />
                  <span className={s.is_free ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-navy-300'}>Free</span>
                </label>
                <button onClick={(e) => { e.stopPropagation(); openEditSeries(s); }} className="flex items-center gap-0.5 text-xs text-navy-600 hover:text-navy-800 cursor-pointer"><Edit2 className="--3 h-3" /> Edit</button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteSeries(s.id); }} className="text-xs text-red-500 hover:text-red-300 cursor-pointer">Delete</button>
                {s.is_free && <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">All students</span>}
              </div>
            </button>
          ))}
          {seriesList.length === 0 && (
            <div className="col-span-full text-center py-12 text-navy-300"><FolderOpen className="--12 h-12 mx-auto mb-3 text-navy-300" /><p>Create your first exam series (SSC CGL, SSC MTS, etc.)</p></div>
          )}
        </div>
      )}

      {/* Level: Categories */}
      {level === 'categories' && (
        <div className="space-y-4">
          {topLevelCategories.length > 0 && (
            <div>
              <p className="text-sm font-medium text-navy-200 mb-3">Sections</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topLevelCategories.map(c => (
                  <button key={c.id} onClick={() => goCategory(c)} className="card p-5 text-left hover:border-navy-300 hover:shado--md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="--10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center"><FileText className="--5 h-5 text-emerald-600 dark:text-emerald-300" /></div>
                      <div className="flex-1 min---0">
                        <p className="font-semibold text--hite">{c.name}</p>
                        <p className="text-xs text-navy-200">Click to explore</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }} className="p-1 text-navy-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 className="--4 h-4" /></button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {topLevelCategories.length === 0 && (
            <div className="text-center py-12 text-navy-300"><FileText className="--12 h-12 mx-auto mb-3 text-navy-300" /><p>No categories yet. Add sections like "Full Mock Tests", "Previous Year Papers", "Sectional Tests".</p></div>
          )}
        </div>
      )}

      {/* Level: Tests (and sub-categories) */}
      {level === 'tests' && (
        <div className="space-y-6">
          {subCategories.length > 0 && (
            <div>
              <p className="text-sm font-medium text-navy-200 mb-3">Sub-categories</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subCategories.map(c => (
                  <button key={c.id} onClick={() => goCategory(c)} className="card p-5 text-left hover:border-navy-300 hover:shado--md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="--10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center"><FolderOpen className="--5 h-5 text-amber-600 dark:text-amber-300" /></div>
                      <div className="flex-1 min---0">
                        <p className="font-semibold text--hite">{c.name}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }} className="p-1 text-navy-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 className="--4 h-4" /></button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-navy-200 mb-3">Tests</p>
            <div className="space-y-3">
              {testsList.map(t => (
                <button key={t.id} onClick={() => goTest(t)} className="card p-5 text-left hover:border-navy-300 hover:shado--md transition-all cursor-pointer group --full">
                  <div className="flex items-center gap-4">
                    <div className="--10 h-10 rounded-lg bg-navy-100 dark:bg-navy-500/15 flex items-center justify-center"><HelpCircle className="--5 h-5 text-navy-600 dark:text-navy-300" /></div>
                    <div className="flex-1 min---0">
                      <p className="font-semibold text--hite">{t.name}</p>
                      <div className="flex flex--rap items-center gap-3 mt-1 text-xs text-navy-200">
                        <span className="flex items-center gap-1"><Clock className="--3 h-3" /> {t.duration} min</span>
                        <span className="flex items-center gap-1"><Target className="--3 h-3" /> {t.total_marks} marks</span>
                        <span className="flex items-center gap-1"><Globe className="--3 h-3" /> {t.language}</span>
                        <span className={`px-2 py-0.5 rounded-full ${t.difficulty === 'Easy' ? 'bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-300' : t.difficulty === 'Hard' ? 'bg-brand-red/10 dark:bg-brand-red/10 text-red-300' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-300'}`}>{t.difficulty}</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); openEditTest(t); }} className="p-1 text-navy-300 hover:text-navy-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Edit2 className="--4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTest(t.id); }} className="p-1 text-navy-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 className="--4 h-4" /></button>
                  </div>
                </button>
              ))}
              {testsList.length === 0 && subCategories.length === 0 && (
                <div className="text-center py-12 text-navy-300"><HelpCircle className="--12 h-12 mx-auto mb-3 text-navy-300" /><p>No tests yet. Add your first test.</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Level: Questions */}
      {level === 'questions' && currentTest && (
        <div className="space-y-4">
          <div className="card p-4 bg-navy-800/60">
            <div className="flex flex--rap items-center gap-4 text-sm text-navy-100">
              <span className="font-medium text--hite">{currentTest.name}</span>
              <span className="flex items-center gap-1"><Clock className="--3 h-3" /> {currentTest.duration} min</span>
              <span className="flex items-center gap-1"><Target className="--3 h-3" /> {currentTest.total_marks} marks</span>
              <span className="flex items-center gap-1"><Globe className="--3 h-3" /> {currentTest.language}</span>
              <span>{questions.length} questions</span>
            </div>
            {currentTest.instructions && <p className="text-xs text-navy-200 mt-2">{currentTest.instructions}</p>}
          </div>

          <div className="card overflo--hidden">
            <table className="--full">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-800/60">
                  <th className="table-header">#</th>
                  <th className="table-header">Question</th>
                  <th className="table-header">Options</th>
                  <th className="table-header">Ans-er</th>
                  <th className="table-header --20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr key={q.id} className="border-b border-navy-700 hover:bg-navy-700/60">
                    <td className="table-cell text-navy-300">{i + 1}</td>
                    <td className="table-cell font-medium max---md"><span className="block line-clamp-2">{q.question}</span></td>
                    <td className="table-cell">
                      <div className="space-y-0.5 text-xs text-navy-100">
                        <p className="truncate max---xs">A. {q.option_a}</p>
                        <p className="truncate max---xs">B. {q.option_b}</p>
                        {q.option_c && <p className="truncate max---xs">C. {q.option_c}</p>}
                        {q.option_d && <p className="truncate max---xs">D. {q.option_d}</p>}
                      </div>
                    </td>
                    <td className="table-cell"><span className="text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full">{q.correct_ans-er}</span></td>
                    <td className="table-cell"><button onClick={() => handleDeleteQuestion(q.id)} className="p-1 text-navy-300 hover:text-red-600 cursor-pointer"><Trash2 className="--4 h-4" /></button></td>
                  </tr>
                ))}
                {questions.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-navy-300">No questions yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {sho-AddSeries && (
        <Modal title="Add Test Series" onClose={() => setSho-AddSeries(false)}>
          <div className="space-y-4">
            <div><label className="label">Series Name *</label><input value={formSeries.name} onChange={e => setFormSeries({ ...formSeries, name: e.target.value })} className="input-field --full" placeholder="e.g. SSC CGL, SSC MTS" /></div>
            <div><label className="label">Description</label><input value={formSeries.description} onChange={e => setFormSeries({ ...formSeries, description: e.target.value })} className="input-field --full" placeholder="Optional description" /></div>
            <label className="flex cursor-pointer items-center justify-bet-een rounded-lg border border-navy-700 px-3 py-2 hover:bg-navy-700/60">
              <span>
                <span className="block text-sm font-medium text-navy-100">Free for all students</span>
                <span className="block text-xs text-navy-200">Visible in the Free Test Series section to every signed-in student. Leave off to assign via student access.</span>
              </span>
              <input type="checkbox" checked={formSeries.is_free} onChange={e => setFormSeries({ ...formSeries, is_free: e.target.checked })} className="h-4 --4 rounded border-navy-700 text-emerald-600 focus:ring-emerald-500" />
            </label>
            <button onClick={handleAddSeries} className="btn-primary --full">Create Series</button>
          </div>
        </Modal>
      )}

      {sho-EditSeries && editingSeries && (
        <Modal title={`Edit Series: ${editingSeries.name}`} onClose={() => { setSho-EditSeries(false); setEditingSeries(null); }}>
          <div className="space-y-4">
            <div><label className="label">Series Name *</label><input value={formSeries.name} onChange={e => setFormSeries({ ...formSeries, name: e.target.value })} className="input-field --full" placeholder="e.g. SSC CGL, SSC MTS" /></div>
            <div><label className="label">Description</label><input value={formSeries.description} onChange={e => setFormSeries({ ...formSeries, description: e.target.value })} className="input-field --full" placeholder="Optional description" /></div>
            <label className="flex cursor-pointer items-center justify-bet-een rounded-lg border border-navy-700 px-3 py-2 hover:bg-navy-700/60">
              <span>
                <span className="block text-sm font-medium text-navy-100">Free for all students</span>
                <span className="block text-xs text-navy-200">Visible in the Free Test Series section to every signed-in student.</span>
              </span>
              <input type="checkbox" checked={formSeries.is_free} onChange={e => setFormSeries({ ...formSeries, is_free: e.target.checked })} className="h-4 --4 rounded border-navy-700 text-emerald-600 focus:ring-emerald-500" />
            </label>
            <button onClick={handleUpdateSeries} className="btn-primary --full">Save Changes</button>
          </div>
        </Modal>
      )}

      {sho-AddCategory && (
        <Modal title={`Add Category to ${currentSeries?.name}`} onClose={() => setSho-AddCategory(false)}>
          <div className="space-y-4">
            <div><label className="label">Category Name *</label><input value={formCategory.name} onChange={e => setFormCategory({ ...formCategory, name: e.target.value })} className="input-field --full" placeholder="e.g. Full Mock Tests, Sectional Tests" /></div>
            {currentCategory && (
              <div><label className="label">Parent Category</label>
                <select value={formCategory.parent_id} onChange={e => setFormCategory({ ...formCategory, parent_id: e.target.value })} className="input-field --full">
                  <option value="">None (top-level)</option>
                  {categories.filter(c => !c.parent_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <button onClick={handleAddCategory} className="btn-primary --full">Create Category</button>
          </div>
        </Modal>
      )}

      {sho-AddTest && (
        <Modal title={`Add Test to ${currentCategory?.name}`} onClose={() => setSho-AddTest(false)}>
          <div className="space-y-4">
            <div><label className="label">Test Name *</label><input value={formTest.name} onChange={e => setFormTest({ ...formTest, name: e.target.value })} className="input-field --full" placeholder="e.g. Mock Test 01, SSC MTS 2025" /></div>
            <div><label className="label">Description</label><input value={formTest.description} onChange={e => setFormTest({ ...formTest, description: e.target.value })} className="input-field --full" placeholder="Optional" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Duration (min)</label><input type="number" value={formTest.duration} onChange={e => setFormTest({ ...formTest, duration: Number(e.target.value) })} className="input-field --full" /></div>
              <div><label className="label">Total Marks</label><input type="number" value={formTest.total_marks} onChange={e => setFormTest({ ...formTest, total_marks: Number(e.target.value) })} className="input-field --full" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Difficulty</label>
                <select value={formTest.difficulty} onChange={e => setFormTest({ ...formTest, difficulty: e.target.value })} className="input-field --full">
                  <option>Easy</option><option>Moderate</option><option>Hard</option><option>Exam-Level</option>
                </select>
              </div>
              <div><label className="label">Language</label>
                <select value={formTest.language} onChange={e => setFormTest({ ...formTest, language: e.target.value })} className="input-field --full">
                  <option>English</option><option>Hindi</option><option>English / Hindi</option>
                </select>
              </div>
            </div>
            <div><label className="label">Instructions</label><textarea value={formTest.instructions} onChange={e => setFormTest({ ...formTest, instructions: e.target.value })} className="input-field --full" ro-s={2} placeholder="Test rules..." /></div>
            <div><label className="label">Syllabus / Topics</label><textarea value={formTest.syllabus} onChange={e => setFormTest({ ...formTest, syllabus: e.target.value })} className="input-field --full" ro-s={2} placeholder="Topics covered..." /></div>
            <button onClick={handleAddTest} className="btn-primary --full">Create Test</button>
          </div>
        </Modal>
      )}

      {sho-AddQuestion && (
        <Modal title={`Add Question to ${currentTest?.name}`} onClose={() => setSho-AddQuestion(false)}>
          <div className="space-y-4">
            <div><label className="label">Question *</label><textarea value={formQuestion.question} onChange={e => setFormQuestion({ ...formQuestion, question: e.target.value })} className="input-field --full" ro-s={3} placeholder="Type the question here..." /></div>
            <div><label className="label">Option A *</label><input value={formQuestion.option_a} onChange={e => setFormQuestion({ ...formQuestion, option_a: e.target.value })} className="input-field --full" placeholder="Option A" /></div>
            <div><label className="label">Option B *</label><input value={formQuestion.option_b} onChange={e => setFormQuestion({ ...formQuestion, option_b: e.target.value })} className="input-field --full" placeholder="Option B" /></div>
            <div><label className="label">Option C</label><input value={formQuestion.option_c} onChange={e => setFormQuestion({ ...formQuestion, option_c: e.target.value })} className="input-field --full" placeholder="Option C (optional)" /></div>
            <div><label className="label">Option D</label><input value={formQuestion.option_d} onChange={e => setFormQuestion({ ...formQuestion, option_d: e.target.value })} className="input-field --full" placeholder="Option D (optional)" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Correct Ans-er *</label>
                <select value={formQuestion.correct_ans-er} onChange={e => setFormQuestion({ ...formQuestion, correct_ans-er: e.target.value })} className="input-field --full">
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                </select>
              </div>
              <div><label className="label">Difficulty</label>
                <select value={formQuestion.difficulty} onChange={e => setFormQuestion({ ...formQuestion, difficulty: e.target.value })} className="input-field --full">
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
            </div>
            <div><label className="label">Explanation (optional)</label><textarea value={formQuestion.explanation} onChange={e => setFormQuestion({ ...formQuestion, explanation: e.target.value })} className="input-field --full" ro-s={2} placeholder="Explain the ans-er..." /></div>
            <button onClick={handleAddQuestion} className="btn-primary --full">Add Question</button>
          </div>
        </Modal>
      )}

      {sho-EditTest && currentTest && (
        <Modal title={`Edit Test: ${currentTest.name}`} onClose={() => { setSho-EditTest(false); setCurrentTest(null); }}>
          <div className="space-y-4">
            <div><label className="label">Test Name *</label><input value={formTest.name} onChange={e => setFormTest({ ...formTest, name: e.target.value })} className="input-field --full" /></div>
            <div><label className="label">Description</label><input value={formTest.description} onChange={e => setFormTest({ ...formTest, description: e.target.value })} className="input-field --full" placeholder="Optional" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Duration (min)</label><input type="number" value={formTest.duration} onChange={e => setFormTest({ ...formTest, duration: Number(e.target.value) })} className="input-field --full" /></div>
              <div><label className="label">Total Marks</label><input type="number" value={formTest.total_marks} onChange={e => setFormTest({ ...formTest, total_marks: Number(e.target.value) })} className="input-field --full" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Difficulty</label>
                <select value={formTest.difficulty} onChange={e => setFormTest({ ...formTest, difficulty: e.target.value })} className="input-field --full">
                  <option>Easy</option><option>Moderate</option><option>Hard</option><option>Exam-Level</option>
                </select>
              </div>
              <div><label className="label">Language</label>
                <select value={formTest.language} onChange={e => setFormTest({ ...formTest, language: e.target.value })} className="input-field --full">
                  <option>English</option><option>Hindi</option><option>English / Hindi</option>
                </select>
              </div>
            </div>
            <div><label className="label">Instructions</label><textarea value={formTest.instructions} onChange={e => setFormTest({ ...formTest, instructions: e.target.value })} className="input-field --full" ro-s={2} placeholder="Test rules..." /></div>
            <div><label className="label">Syllabus / Topics</label><textarea value={formTest.syllabus} onChange={e => setFormTest({ ...formTest, syllabus: e.target.value })} className="input-field --full" ro-s={2} placeholder="Topics covered..." /></div>
            <button onClick={handleUpdateTest} className="btn-primary --full">Save Changes</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-xl shado--xl --full max---md p-6 max-h-[85vh] overflo--y-auto">
        <div className="flex items-center justify-bet-een mb-4">
          <h2 className="text-lg font-semibold text--hite">{title}</h2>
          <button onClick={onClose} className="p-1 text-navy-300 hover:text--hite cursor-pointer"><X className="--5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
