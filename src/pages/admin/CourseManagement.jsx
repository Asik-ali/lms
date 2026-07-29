import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, ChevronDown } from 'lucide-react';
import { getCourses, addCourse, updateCourse, deleteCourse, getCategories } from '../../data/dynamicStore';

const emptyForm = { title: '', instructor: '', category: '', duration: '', status: 'Draft' };

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [cats, setCats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => { refresh(); loadCats(); }, []);

  async function refresh() {
    setCourses([...(await getCourses())]);
  }

  async function loadCats() {
    setCats(await getCategories());
  }

  function handleOpenAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function handleOpenEdit(course) {
    setForm({ title: course.title, instructor: course.instructor, category: course.category, duration: course.duration, status: course.status });
    setEditingId(course.id);
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editingId) {
      await updateCourse(editingId, form);
    } else {
      await addCourse(form);
    }
    await refresh();
    handleClose();
  }

  async function handleDelete(id) {
    await deleteCourse(id);
    await refresh();
  }

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'All' || c.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
        <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="input-field appearance-none pr-10"
          >
            <option value="All">All Categories</option>
            {cats.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editingId ? 'Edit Course' : 'Add Course'}</h2>
            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input name="title" value={form.title} onChange={handleChange} className="input-field w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
              <input name="instructor" value={form.instructor} onChange={handleChange} className="input-field w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field w-full" required>
                <option value="">Select category</option>
                {cats.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input name="duration" value={form.duration} onChange={handleChange} className="input-field w-full" required placeholder="e.g. 8 weeks" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input-field w-full">
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'} Course</button>
              <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Title</th>
              <th className="table-header">Instructor</th>
              <th className="table-header">Category</th>
              <th className="table-header">Students</th>
              <th className="table-header">Lessons</th>
              <th className="table-header">Status</th>
              <th className="table-header">Duration</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell font-medium">{c.title}</td>
                <td className="table-cell text-gray-500">{c.instructor}</td>
                <td className="table-cell">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.category}</span>
                </td>
                <td className="table-cell">{c.students}</td>
                <td className="table-cell">{c.lessons}</td>
                <td className="table-cell">
                  <span className={`badge ${c.status === 'Published' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                </td>
                <td className="table-cell text-gray-500">{c.duration}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
