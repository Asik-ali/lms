import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Edit2, Ban, Plus, ChevronDown, ArrowLeft, UserPlus, Copy, Check, LogIn } from 'lucide-react';
import { students as mockStudents, courses } from '../../data/mockData';
import { saveCredential } from '../../data/credentialsStore';
import { useAuth } from '../../contexts/AuthContext';

function generateUsername(name) {
  return name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
}

function AddStudentForm({ onBack }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', course: courses[0]?.title || '', enrolled: new Date().toISOString().split('T')[0] });
  const [submitted, setSubmitted] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    const username = generateUsername(form.name);
    const password = 'lms' + Math.random().toString(36).slice(2, 7);
    saveCredential({ username, password, studentId: Date.now(), name: form.name, email: form.email, course: form.course, enrolled: form.enrolled });
    setCredentials({ username, password });
    setSubmitted(true);
  };

  const copyCredentials = () => {
    const text = `Username: ${credentials.username}\nPassword: ${credentials.password}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickLogin = () => {
    logout();
    navigate(`/login?username=${credentials.username}&password=${credentials.password}`);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => { setSubmitted(false); setCredentials(null); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Student Added Successfully!</h2>
          <p className="text-gray-500 mb-6">{form.name} has been enrolled in {form.course}.</p>

          <div className="max-w-sm mx-auto bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-indigo-800 mb-3">Login Credentials</h3>
            <p className="text-xs text-indigo-600 mb-3">Share these credentials with the student. They work in the same browser session for demo.</p>
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-indigo-100">
                <span className="text-xs text-gray-500">Username</span>
                <span className="text-sm font-mono font-medium text-gray-900">{credentials.username}</span>
              </div>
              <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-indigo-100">
                <span className="text-xs text-gray-500">Password</span>
                <span className="text-sm font-mono font-medium text-gray-900">{credentials.password}</span>
              </div>
            </div>
            <button onClick={copyCredentials} className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-indigo-700 bg-white border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-100 transition-colors cursor-pointer">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Credentials'}
            </button>
            <button onClick={quickLogin} className="mt-2 w-full flex items-center justify-center gap-2 text-sm text-indigo-700 bg-white border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-100 transition-colors cursor-pointer">
              <LogIn className="w-4 h-4" /> Quick Login as {form.name.split(' ')[0]}
            </button>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button onClick={() => { setSubmitted(false); setCredentials(null); setForm({ name: '', email: '', course: courses[0]?.title || '', enrolled: new Date().toISOString().split('T')[0] }); }} className="btn-primary">Add Another</button>
            <button onClick={onBack} className="btn-secondary">Back to Students</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Add New Student</h2>
          <p className="text-sm text-gray-500 mt-1">Fill in the details to enroll a new student — credentials will be auto-generated</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Enter full name" className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Enter email address" className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))} className="input-field">
              {courses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
            <input type="date" value={form.enrolled} onChange={e => setForm(p => ({ ...p, enrolled: e.target.value }))} className="input-field" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="btn-primary">Enroll Student</button>
            <button type="button" onClick={onBack} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [students, setStudents] = useState(mockStudents);

  const isAddPage = location.pathname.endsWith('/add');

  if (isAddPage) return <AddStudentForm onBack={() => navigate('/admin/students')} />;

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statuses = ['All', ...new Set(students.map(s => s.status))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <button onClick={() => navigate('/admin/students/add')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 cursor-pointer">
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Name</th>
              <th className="table-header">Email</th>
              <th className="table-header">Course</th>
              <th className="table-header">Status</th>
              <th className="table-header">Enrolled Date</th>
              <th className="table-header">Progress</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell font-medium">{s.name}</td>
                <td className="table-cell text-gray-500">{s.email}</td>
                <td className="table-cell">{s.course}</td>
                <td className="table-cell">
                  <span className={`badge ${s.status === 'Active' ? 'badge-success' : s.status === 'Suspended' ? 'badge-danger' : 'badge-warning'}`}>{s.status}</span>
                </td>
                <td className="table-cell">{s.enrolled}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.progress >= 70 ? 'bg-green-500' : s.progress >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.progress}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{s.progress}%</span>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"><Ban className="w-4 h-4" /></button>
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
