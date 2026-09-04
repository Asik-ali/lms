import { useState, useEffect } from 'react';
import { FolderOpen, FileText, ChevronRight, Clock, Target, Globe, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFreeTestSeries, getCategoriesBySeries, getTestsByCategoryId } from '../../data/dynamicStore';

export default function StudentFreeTestSeries() {
  const navigate = useNavigate();
  const [seriesList, setSeriesList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testsList, setTestsList] = useState([]);
  const [currentSeries, setCurrentSeries] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [level, setLevel] = useState('series');

  useEffect(() => { loadSeries(); }, []);

  async function loadSeries() {
    try {
      setSeriesList(await getFreeTestSeries());
    } catch (err) {
      console.error('Failed to load free test series:', err);
      setSeriesList([]);
    }
  }

  async function goSeries(s) {
    setCurrentSeries(s);
    setCurrentCategory(null);
    setTestsList([]);
    try {
      const cats = await getCategoriesBySeries(s.id);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
    setLevel('categories');
  }

  async function goCategory(c) {
    setCurrentCategory(c);
    let tests = [];
    try {
      tests = await getTestsByCategoryId(c.id);
    } catch (err) {
      console.error('Failed to load tests:', err);
    }
    setTestsList(tests);
    setLevel('tests');
  }

  function goTest(t) {
    navigate(`/student/test/${t.id}`);
  }

  const topLevelCategories = categories.filter(c => c.parent_id === null || c.parent_id === undefined);
  const showSubCategories = categories.filter(c => c.parent_id === (currentCategory?.id || null)).length > 0;

  const breadcrumb = [
    { label: 'Free Test Series', go: () => { setLevel('series'); setCurrentSeries(null); setCurrentCategory(null); } },
    currentSeries && { label: currentSeries.name, go: () => { setLevel('categories'); setCurrentCategory(null); } },
    currentCategory && { label: currentCategory.name },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-white">Free Test Series</h1>
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-medium">Free</span>
      </div>

      {breadcrumb.length > 1 && (
        <nav className="flex items-center gap-1 text-sm text-navy-200 flex-wrap">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              {b.go ? (
                <button onClick={b.go} className="hover:text-navy-600 cursor-pointer">{b.label}</button>
              ) : (
                <span className="text-white font-medium">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {level === 'series' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map(s => (
            <button key={s.id} onClick={() => goSeries(s)} className="card p-5 text-left hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-300" /></div>
                <div>
                  <p className="font-semibold text-white">{s.name}</p>
                  {s.description && <p className="text-xs text-navy-200">{s.description}</p>}
                </div>
              </div>
            </button>
          ))}
          {seriesList.length === 0 && (
            <div className="col-span-full text-center py-12 text-navy-300">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No free test series available right now.</p>
            </div>
          )}
        </div>
      )}

      {level === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topLevelCategories.map(c => {
            const hasSub = categories.some(cat => cat.parent_id === c.id);
            return (
              <button key={c.id} onClick={() => goCategory(c)} className="card p-5 text-left hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                    {hasSub ? <FolderOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-300" /> : <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-navy-200">{hasSub ? 'Click to explore' : 'Click to view tests'}</p>
                  </div>
                </div>
              </button>
            );
          })}
          {topLevelCategories.length === 0 && (
            <div className="col-span-full text-center py-12 text-navy-300">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No categories available yet.</p>
            </div>
          )}
        </div>
      )}

      {level === 'tests' && (
        <div className="space-y-6">
          {showSubCategories && (
            <div>
              <p className="text-sm font-medium text-navy-200 mb-3">Sub-categories</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.filter(c => c.parent_id === currentCategory.id).map(c => (
                  <button key={c.id} onClick={() => goCategory(c)} className="card p-5 text-left hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-amber-600 dark:text-amber-300" /></div>
                      <p className="font-semibold text-white">{c.name}</p>
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
                <button key={t.id} onClick={() => goTest(t)} className="card p-5 text-left hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center"><FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-300" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{t.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-navy-200">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t.duration} min</span>
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {t.total_marks} marks</span>
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {t.language}</span>
                        <span className={`px-2 py-0.5 rounded-full ${t.difficulty === 'Easy' ? 'bg-green-50 dark:bg-green-500/15 text-green-600 dark:text-green-400' : t.difficulty === 'Hard' ? 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>{t.difficulty}</span>
                      </div>
                    </div>
                    <span className="text-sm text-emerald-600 dark:text-emerald-300 font-medium flex items-center gap-1"><BadgeCheck className="w-4 h-4" /> Start →</span>
                  </div>
                </button>
              ))}
              {testsList.length === 0 && !showSubCategories && (
                <div className="text-center py-12 text-navy-300">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No tests available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
