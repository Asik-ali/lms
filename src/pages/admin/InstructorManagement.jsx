import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Edit2, Star, Mail, Users, BookOpen, Plus, ArrowLeft, Save, X } from 'lucide-react';
import { getInstructors, addInstructor } from '../../data/dynamicStore';
import { supabase } from '../../supabase/client';
import { showError, showSuccess } from '../../components/common/Toast';

function AddInstructorForm({ onBack }) {
  const [form, setForm] = useState({ name: '', email: '', department: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    await addInstructor({ ...form, students: 0, courses: 0, rating: 0 });
    onBack();
  };

  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Instructors
      </button>
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Add New Instructor</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input type="text" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="input-field w-full" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Add Instructor</button>
            <button type="button" onClick={onBack} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditInstructorForm({ instructor, onBack, onSaved }) {
  const [form, setForm] = useState({ name: instructor?.name || '', email: instructor?.email || '', department: instructor?.department || '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    const { error } = await supabase.from('instructors').update(form).eq('id', instructor.id);
    if (error) return showError(error.message || 'Failed to update instructor.');
    showSuccess('Instructor updated.');
    onSaved();
  };

  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Instructor</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input type="text" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="input-field w-full" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" onClick={onBack} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InstructorManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setInstructors(await getAllInstructors());
  }

  const isAddPage = location.pathname.endsWith('/add');
  if (isAddPage) return <AddInstructorForm onBack={() => { navigate('/admin/instructors'); load(); }} />;

  const filtered = instructors.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.email.toLowerCase().includes(search.toLowerCase())
  );

  if (editId) {
    const instructor = instructors.find(i => i.id === editId);
    if (instructor) return <EditInstructorForm instructor={instructor} onBack={() => setEditId(null)} onSaved={() => { setEditId(null); load(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Instructor Management</h1>
        <button onClick={() => navigate('/admin/instructors/add')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Instructor
        </button>
      </div>

      <input
        type="text"
        placeholder="Search instructors..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input-field max-w-md"
      />

      <div className="grid gap-6">
        {filtered.map(instructor => (
          <div key={instructor.id} className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg flex-shrink-0">
                  {instructor.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{instructor.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-500">{instructor.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditId(instructor.id)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{instructor.courses || 0}</p>
                  <p className="text-xs text-gray-500">Courses</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{instructor.students || 0}</p>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{instructor.rating || 0}</p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{instructor.department || '-'}</p>
                  <p className="text-xs text-gray-500">Department</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">No instructors found. Add one to get started.</div>
        )}
      </div>
    </div>
  );
}
