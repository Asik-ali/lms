import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Save, Loader2, BookOpen, PenTool, ShoppingCart, IndianRupee } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { getAllCourses, getAllTestSeries } from '../../data/dynamicStore';
import { apiUrl } from '../../data/api';
import { showSuccess, showError } from '../../components/common/Toast';

const emptyForm = { id: null, name: '', description: '', price: '', status: 'active', items: [] };

const statusBadge = (status) =>
  status === 'active' ? 'badge-success' : 'badge-danger';

export default function SalesPlansPage() {
  const [plans, setPlans] = useState([]);
  const [courses, setCourses] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const apiToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  }, []);

  const loadPlans = useCallback(async () => {
    const token = await apiToken();
    const res = await fetch(apiUrl('/api/sales-plans'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load plans');
    return data || [];
  }, [apiToken]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await loadPlans());
    } catch (err) {
      console.error('Failed to load sales plans:', err);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadPlans]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    (async () => {
      try {
        const [c, s] = await Promise.all([getAllCourses(), getAllTestSeries()]);
        setCourses(c || []);
        setSeriesList(s || []);
      } catch (err) {
        console.error('Failed to load courses/series:', err);
      }
    })();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(p) {
    setForm({
      id: p.id,
      name: p.name || '',
      description: p.description || '',
      price: p.price != null ? String(p.price) : '',
      status: p.status || 'active',
      items: (p.items || []).map(it => ({ item_type: it.item_type, item_id: Number(it.item_id) })),
    });
    setShowForm(true);
  }

  function toggleItem(type, id) {
    const current = form.items.some(it => it.item_type === type && Number(it.item_id) === Number(id));
    if (current) {
      setForm(f => ({ ...f, items: f.items.filter(it => !(it.item_type === type && Number(it.item_id) === Number(id))) }));
    } else {
      setForm(f => ({ ...f, items: [...f.items, { item_type: type, item_id: Number(id) }] }));
    }
  }

  async function handleSave() {
    if (!form.name.trim()) return showError('Plan name is required');
    if (form.price === '' || Number(form.price) < 0) return showError('Enter a valid price');
    if (form.items.length === 0) return showError('Select at least one course or test series');

    setSaving(true);
    const token = await apiToken();
    const url = form.id ? `${apiUrl('/api/sales-plans')}?planId=${form.id}` : apiUrl('/api/sales-plans');
    try {
      const res = await fetch(url, {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          status: form.status,
          items: form.items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save plan');
      showSuccess(form.id ? 'Plan updated!' : 'Plan created!');
      setShowForm(false);
      await refresh();
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Delete plan "${p.name}"? This cannot be undone.`)) return;
    const token = await apiToken();
    try {
      const res = await fetch(`${apiUrl('/api/sales-plans')}?planId=${p.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete plan');
      }
      showSuccess('Plan deleted');
      await refresh();
    } catch (err) {
      showError(err.message);
    }
  }

  function itemLabel(it) {
    if (it.item_type === 'course') {
      const c = courses.find(x => Number(x.id) === Number(it.item_id));
      return c ? c.title : `Course #${it.item_id}`;
    }
    const s = seriesList.find(x => Number(x.id) === Number(it.item_id));
    return s ? s.name : `Test Series #${it.item_id}`;
  }

  const selectedCourseIds = new Set(form.items.filter(i => i.item_type === 'course').map(i => Number(i.item_id)));
  const selectedSeriesIds = new Set(form.items.filter(i => i.item_type === 'test_series').map(i => Number(i.item_id)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Sales Plans</h1>
        {!showForm && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" /> New Plan
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {form.id ? 'Edit Plan' : 'Create Plan'}
            </h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-navy-700 rounded cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-100 mb-1">Plan Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field w-full" placeholder="e.g. Gold Combo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-100 mb-1">Price (INR) *</label>
              <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input-field w-full" placeholder="e.g. 4999" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-100 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input-field w-full resize-none" placeholder="What does this plan include?" />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-100 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-field w-full">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-100 mb-2">
              Included Courses ({selectedCourseIds.size})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {courses.map(c => {
                const on = selectedCourseIds.has(Number(c.id));
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleItem('course', c.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm cursor-pointer transition-all ${on ? 'border-navy-400 bg-navy-50 dark:bg-navy-500/10 text-navy-700 dark:text-navy-300' : 'border-navy-700 text-navy-100 hover:border-navy-500'}`}
                  >
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </button>
                );
              })}
              {courses.length === 0 && <p className="text-xs text-navy-300 col-span-full">No courses found.</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-100 mb-2">
              Included Test Series ({selectedSeriesIds.size})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {seriesList.map(s => {
                const on = selectedSeriesIds.has(Number(s.id));
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleItem('test_series', s.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm cursor-pointer transition-all ${on ? 'border-navy-400 bg-navy-50 dark:bg-navy-500/10 text-navy-700 dark:text-navy-300' : 'border-navy-700 text-navy-100 hover:border-navy-500'}`}
                  >
                    <PenTool className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{s.name}</span>
                  </button>
                );
              })}
              {seriesList.length === 0 && <p className="text-xs text-navy-300 col-span-full">No test series found.</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : form.id ? 'Update Plan' : 'Create Plan'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-navy-700 text-navy-100 hover:bg-navy-700/60 cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      {!showForm && (
        loading ? (
          <div className="flex items-center justify-center py-16 text-navy-300">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="card p-10 text-center text-navy-300">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-navy-300" />
            <p>No sales plans yet. Click "New Plan" to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(p => (
              <div key={p.id} className="card p-6 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <span className={`badge ${statusBadge(p.status)}`}>{p.status}</span>
                </div>
                {p.description && <p className="text-sm text-navy-200 mb-3 line-clamp-2">{p.description}</p>}
                <div className="flex items-baseline gap-1 mb-4">
                  <IndianRupee className="w-4 h-4 text-navy-200" />
                  <span className="text-2xl font-bold text-white">{Number(p.price).toLocaleString('en-IN')}</span>
                </div>
                <div className="space-y-1.5 mb-5 text-sm text-navy-100 flex-1">
                  {(p.items || []).length === 0 ? (
                    <p className="text-xs text-navy-300">No items (full access)</p>
                  ) : p.items.map((it, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {it.item_type === 'course' ? <BookOpen className="w-4 h-4 text-navy-500 flex-shrink-0" /> : <PenTool className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      <span className="truncate">{itemLabel(it)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => openEdit(p)} className="btn-secondary flex-1 flex items-center justify-center gap-2 cursor-pointer"><Pencil className="w-4 h-4" /> Edit</button>
                  <button onClick={() => handleDelete(p)} className="px-3 py-2 rounded-lg border border-brand-red/40 text-red-300 hover:bg-brand-red/10 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
