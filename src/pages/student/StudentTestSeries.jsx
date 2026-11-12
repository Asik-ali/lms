import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, FileText, ChevronRight, Clock, Target, Globe, CalendarDays, LockKeyhole } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllTestSeries, getCategoriesBySeries, getTestsByCategoryId } from '../../data/dynamicStore';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import TestExperienceHeader from '../../components/test/TestExperienceHeader';

function normalizeAccess(value) {
  if (!value) return [];
  return value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

function matches(seriesName, accessList) {
  const name = (seriesName || '').trim().toLowerCase();
  return accessList.includes(name);
}

export default function StudentTestSeries() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedSeriesId = searchParams.get('seriesId');
  const [seriesList, setSeriesList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testsList, setTestsList] = useState([]);
  const [scheduleTests, setScheduleTests] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  const [currentSeries, setCurrentSeries] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [level, setLevel] = useState('series');

  const loadSeries = useCallback(async () => {
    if (!user?.id) {
      setSeriesList([]);
      return;
    }
    try {
      const [all, { data: purchases, error: purchaseError }] = await Promise.all([
        getAllTestSeries(),
        supabase.from('purchases').select('plan_id').eq('student_id', user.id).eq('granted', true),
      ]);
      if (purchaseError) throw purchaseError;
      const planIds = [...new Set((purchases || []).map(p => p.plan_id).filter(Boolean))];
      let ownedSeriesIds = new Set();
      if (planIds.length) {
        const { data: items, error: itemsError } = await supabase.from('sales_plan_items')
          .select('item_id').in('plan_id', planIds).eq('item_type', 'test_series');
        if (itemsError) throw itemsError;
        ownedSeriesIds = new Set((items || []).map(item => String(item.item_id)));
      }
      const access = normalizeAccess(user?.test_series_access || '');
      setSeriesList(all.filter(s => s.is_free || ownedSeriesIds.has(String(s.id)) || matches(s.name, access)));
    } catch (err) {
      console.error('Failed to load test series:', err);
      setSeriesList([]);
    }
  }, [user?.id, user?.test_series_access]);

  useEffect(() => { loadSeries(); }, [loadSeries]);
  useEffect(() => {
    if (!requestedSeriesId || !seriesList.length || currentSeries) return;
    const requested = seriesList.find(series => String(series.id) === requestedSeriesId);
    if (requested) goSeries(requested);
  }, [requestedSeriesId, seriesList, currentSeries]);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  async function goSeries(s) {
    setCurrentSeries(s);
    setCurrentCategory(null);
    setTestsList([]);
    try {
      const cats = await getCategoriesBySeries(s.id);
      setCategories(cats);
      const scheduledTests = (await Promise.all(cats.map(async category => {
        const tests = await getTestsByCategoryId(category.id);
        return tests.filter(test => test.status !== 'Archived' && test.available_at)
          .map(test => ({ ...test, category_name: category.name }));
      }))).flat().sort((a, b) => new Date(a.available_at) - new Date(b.available_at));
      setScheduleTests(scheduledTests);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
      setScheduleTests([]);
    }
    setLevel('categories');
  }

  async function goCategory(c) {
    setCurrentCategory(c);
    const cats = categories.filter(cat => cat.parent_id === c.id);
    let tests = [];
    try {
      tests = await getTestsByCategoryId(c.id);
    } catch (err) {
      console.error('Failed to load tests:', err);
    }
    setTestsList(tests.filter(test => test.status !== 'Archived'));
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
    <div className="test-experience space-y-6">
      <TestExperienceHeader title="Test Series" subtitle="Choose your next challenge. Practice at your pace and track every step forward." />

      {breadcrumb.length > 1 && (
        <nav className="flex items-center gap-1 text-sm text-navy-200 flex-wrap">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              {b.go ? (
                <button onClick={b.go} className="hover:text-navy-600 cursor-pointer">{b.label}</button>
              ) : (
                <span className="text-navy-100 font-medium">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {level === 'series' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map(s => (
            <button key={s.id} onClick={() => goSeries(s)} className="card p-5 text-left hover:border-navy-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-navy-50 dark:bg-navy-500/15 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-navy-600 dark:text-navy-300" /></div>
                <div>
                  <p className="font-semibold text-navy-100">{s.name}</p>
                  {s.description && <p className="text-xs text-navy-200">{s.description}</p>}
                </div>
              </div>
            </button>
          ))}
          {seriesList.length === 0 && (
            <div className="col-span-full text-center py-12 text-navy-300">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-navy-300" />
              <p>No test series assigned to you yet.</p>
            </div>
          )}
        </div>
      )}

      {level === 'categories' && (
        <div className="space-y-6">
        {scheduleTests.length > 0 && (
          <section className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-navy-700/20 p-4 sm:p-5">
              <CalendarDays className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
              <div>
                <h2 className="font-semibold text-navy-100">Test Schedule</h2>
                <p className="text-xs text-navy-300">Each scheduled test opens on its date.</p>
              </div>
            </div>
            <div className="divide-y divide-navy-700/15">
              {scheduleTests.map(test => {
                const locked = new Date(test.available_at).getTime() > now;
                const published = String(test.status || '').toLowerCase() === 'published';
                const disabled = locked || !published;
                return (
                  <div key={test.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-navy-100">{test.name}</p>
                      <p className="mt-0.5 text-xs text-navy-300">{test.category_name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-navy-200 sm:min-w-44">
                      <CalendarDays className="h-4 w-4 shrink-0" />
                      <span>{new Date(test.available_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <button type="button" disabled={disabled} onClick={() => goTest(test)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-32">
                      {locked ? <><LockKeyhole className="h-4 w-4" /> Opens on date</> : !published ? 'Not published' : 'Open test'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topLevelCategories.map(c => {
            const hasSub = categories.some(cat => cat.parent_id === c.id);
            return (
              <button key={c.id} onClick={() => goCategory(c)} className="card p-5 text-left hover:border-navy-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                    {hasSub ? <FolderOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-300" /> : <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />}
                  </div>
                  <div>
                    <p className="font-semibold text-navy-100">{c.name}</p>
                    <p className="text-xs text-navy-200">{hasSub ? 'Click to explore' : 'Click to view tests'}</p>
                  </div>
                </div>
              </button>
            );
          })}
          {topLevelCategories.length === 0 && (
            <div className="col-span-full text-center py-12 text-navy-300">
              <FileText className="w-12 h-12 mx-auto mb-3 text-navy-300" />
              <p>No categories available yet.</p>
            </div>
          )}
        </div>
        </div>
      )}

      {level === 'tests' && (
        <div className="space-y-6">
          {subCategories.length > 0 && (
            <div>
              <p className="text-sm font-medium text-navy-200 mb-3">Sub-categories</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subCategories.map(c => (
                  <button key={c.id} onClick={() => goCategory(c)} className="card p-5 text-left hover:border-navy-300 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-amber-600 dark:text-amber-300" /></div>
                      <p className="font-semibold text-navy-100">{c.name}</p>
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
                <button key={t.id} disabled={Boolean(t.available_at && new Date(t.available_at).getTime() > now)} onClick={() => goTest(t)} className="card p-5 text-left hover:border-navy-300 hover:shadow-md transition-all cursor-pointer w-full disabled:cursor-not-allowed disabled:opacity-70">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-navy-50 dark:bg-navy-500/15 flex items-center justify-center"><FileText className="w-5 h-5 text-navy-600 dark:text-navy-300" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy-100">{t.name}</p>
                      {t.available_at && new Date(t.available_at).getTime() > now && <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">Available {new Date(t.available_at).toLocaleString()}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-navy-200">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t.duration} min</span>
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {t.total_marks} marks</span>
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {t.language}</span>
                        <span className={`px-2 py-0.5 rounded-full ${t.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : t.difficulty === 'Hard' ? 'bg-brand-red/10 text-red-700 dark:text-red-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>{t.difficulty}</span>
                      </div>
                    </div>
                    <span className="text-sm text-navy-600 dark:text-navy-300 font-medium">Start →</span>
                  </div>
                </button>
              ))}
              {testsList.length === 0 && subCategories.length === 0 && (
                <div className="text-center py-12 text-navy-300">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-navy-300" />
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
