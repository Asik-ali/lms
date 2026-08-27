import { useState, useEffect } from 'react';
import { FolderOpen, FileText, ChevronRight, ExternalLink, Clock, Target, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllTestSeries, getCategoriesBySeries, getTestsByCategoryId } from '../../data/dynamicStore';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';

function normalizeAccess(value) {
  if (!value) return [];
  return value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

function matches(seriesName, accessList) {
  const name = (seriesName || '').trim().toLowerCase();
  return accessList.some(a => a === name || a.includes(name) || name.includes(a));
}

export default function StudentTestSeries() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seriesList, setSeriesList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testsList, setTestsList] = useState([]);
  const [currentSeries, setCurrentSeries] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [level, setLevel] = useState('series');

  useEffect(() => { loadSeries(); }, [user?.test_series_access]);

  async function loadSeries() {
    const all = await getAllTestSeries();
    const access = normalizeAccess(user?.test_series_access || '');
    if (access.length > 0) {
      setSeriesList(all.filter(s => matches(s.name, access)));
    } else {
      setSeriesList([]);
    }
  }

  async function goSeries(s) {
    setCurrentSeries(s);
    setCurrentCategory(null);
    setTestsList([]);
    const cats = await getCategoriesBySeries(s.id);
    setCategories(cats);
    setLevel('categories');
  }

  async function goCategory(c) {
    setCurrentCategory(c);
    const cats = categories.filter(cat => cat.parent_id === c.id);
    const tests = await getTestsByCategoryId(c.id);
    if (cats.length > 0) {
      setCategories([...categories]);
      setTestsList(tests);
    } else {
      setTestsList(tests);
    }
    setLevel('tests');
  }

  function goTest(t) {
    navigate(`/student/test/${t.id}`);
  }

  function goBack() {
    if (level === 'tests') { setLevel('categories'); setCurrentCategory(null); setTestsList([]); }
    else if (level === 'categories') { setLevel('series'); setCurrentSeries(null); setCategories([]); }
  }

  const topLevelCategories = categories.filter(c => c.parent_id === null || c.parent_id === undefined);
  const subCategories = currentCategory ? categories.filter(c => c.parent_id === currentCategory.id) : [];

  const breadcrumb = [
    { label: 'Test Series', go: () => { setLevel('series'); setCurrentSeries(null); setCurrentCategory(null); } },
    currentSeries && { label: currentSeries.name, go: () => { setLevel('categories'); setCurrentCategory(null); } },
    currentCategory && { label: currentCategory.name },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Test Series</h1>

      {breadcrumb.length > 1 && (
        <nav className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              {b.go ? (
                <button onClick={b.go} className="hover:text-indigo-600 cursor-pointer">{b.label}</button>
              ) : (
                <span className="text-gray-900 font-medium">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {level === 'series' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map(s => (
            <button key={s.id} onClick={() => goSeries(s)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-indigo-600" /></div>
                <div>
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
                </div>
              </div>
            </button>
          ))}
          {seriesList.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No test series assigned to you yet.</p>
            </div>
          )}
        </div>
      )}

      {level === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topLevelCategories.map(c => {
            const hasSub = categories.some(cat => cat.parent_id === c.id);
            return (
              <button key={c.id} onClick={() => goCategory(c)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    {hasSub ? <FolderOpen className="w-5 h-5 text-emerald-600" /> : <FileText className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{hasSub ? 'Click to explore' : 'Click to view tests'}</p>
                  </div>
                </div>
              </button>
            );
          })}
          {topLevelCategories.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No categories available yet.</p>
            </div>
          )}
        </div>
      )}

      {level === 'tests' && (
        <div className="space-y-6">
          {subCategories.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-3">Sub-categories</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subCategories.map(c => (
                  <button key={c.id} onClick={() => goCategory(c)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-amber-600" /></div>
                      <p className="font-semibold text-gray-900">{c.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-500 mb-3">Tests</p>
            <div className="space-y-3">
              {testsList.map(t => (
                <button key={t.id} onClick={() => goTest(t)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center"><FileText className="w-5 h-5 text-indigo-600" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{t.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t.duration} min</span>
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {t.total_marks} marks</span>
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {t.language}</span>
                        <span className={`px-2 py-0.5 rounded-full ${t.difficulty === 'Easy' ? 'bg-green-50 text-green-600' : t.difficulty === 'Hard' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{t.difficulty}</span>
                      </div>
                    </div>
                    <span className="text-sm text-indigo-600 font-medium">Start →</span>
                  </div>
                </button>
              ))}
              {testsList.length === 0 && subCategories.length === 0 && (
                <div className="text-center py-12 text-gray-400">
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
