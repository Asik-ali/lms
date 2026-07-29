import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, FileText, Clock, CheckCircle, X } from 'lucide-react';
import { getAssignments, addAssignment, deleteAssignment, getCourses } from '../../data/dynamicStore';

export default function Assignments() {
  const [search, setSearch] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', course: '', dueDate: '', total: '' });

  const refresh = async () => {
    setAssignments(await getAssignments());
    setCourses(await getCourses());
  };

  useEffect(() => { refresh(); }, []);

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.course.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    await addAssignment({
      title: form.title,
      course: form.course,
      dueDate: form.dueDate,
      total: Number(form.total),
      status: 'Active',
      submissions: 0,
    });
    setForm({ title: '', course: '', dueDate: '', total: '' });
    setShowForm(false);
    await refresh();
  };

  const handleDelete = async (id) => {
    await deleteAssignment(id);
    await refresh();
  };

  const handleEdit = (a) => {
    setForm({ title: a.title, course: a.course, dueDate: a.dueDate, total: String(a.total) });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <button
          onClick={() => { setShowForm(!showForm); setForm({ title: '', course: '', dueDate: '', total: '' }); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : 'Create Assignment'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">New Assignment</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text" required value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select
                required value={form.course}
                onChange={e => setForm({ ...form, course: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">Select course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.title}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date" required value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Students</label>
              <input
                type="number" required min="1" value={form.total}
                onChange={e => setForm({ ...form, total: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Create
            </button>
          </div>
        </form>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search assignments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Title</th>
              <th className="table-header">Course</th>
              <th className="table-header">Due Date</th>
              <th className="table-header">Submissions</th>
              <th className="table-header">Status</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{a.title}</span>
                  </div>
                </td>
                <td className="table-cell text-gray-500">{a.course}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {a.dueDate}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[80px]">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(a.submissions / a.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{a.submissions}/{a.total}</span>
                  </div>
                </td>
                <td className="table-cell">
                  <span className={`badge ${a.status === 'Active' ? 'badge-info' : 'badge-success'}`}>
                    {a.status === 'Active' ? 'Active' : 'Graded'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(a)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
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
