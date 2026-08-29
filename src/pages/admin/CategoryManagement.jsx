import { useState, useEffect } from 'react';
import { Plus, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { getCategories, addCategory, deleteCategory } from '../../data/dynamicStore';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 ${bg} text-white px-4 py-3 rounded-lg shadow-lg text-sm`}>
      <Icon className="w-4 h-4" />
      {message}
    </div>
  );
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => { refresh(); }, []);

  function showToast(message, type) { setToast({ message, type }); }

  async function refresh() {
    try {
      setCategories(await getCategories());
    } catch (err) {
      console.error('Failed to load categories', err);
      showToast('Failed to load categories', 'error');
    }
  }

  async function handleAdd() {
    if (!name.trim()) return;
    if (categories.includes(name.trim())) return showToast('Category already exists', 'error');
    try {
      await addCategory(name.trim());
      showToast('Category added successfully', 'success');
    } catch {
      showToast('Failed to add category', 'error');
    }
    setName('');
    setShowForm(false);
    refresh();
  }

  async function handleDelete(n) {
    if (!confirm(`Delete category "${n}"?`)) return;
    try {
      await deleteCategory(n);
      showToast('Category deleted successfully', 'success');
    } catch {
      showToast('Failed to delete category', 'error');
    }
    refresh();
  }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Category Management</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">New Category</h2>
            <button onClick={() => { setShowForm(false); setName(''); }} className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field w-full"
                placeholder="e.g. Mathematics"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <button onClick={handleAdd} className="btn-primary">Add</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
              <th className="table-header">Name</th>
              <th className="table-header w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="table-cell font-medium">{c}</td>
                <td className="table-cell">
                  <button onClick={() => handleDelete(c)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={2} className="text-center py-8 text-gray-400 dark:text-gray-500">No categories yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
