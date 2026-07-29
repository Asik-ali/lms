import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Search, Plus, ArrowLeft, UserPlus, Copy, Check, LogIn, Save, X, KeyRound } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { getStudents, getCourses } from '../../data/dynamicStore';
import { useAuth } from '../../contexts/AuthContext';

function generateUsername(name) {
  return name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
}

function AddStudentForm({ onBack }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', course: '', enrolled: new Date().toISOString().split('T')[0] });
  const [submitted, setSubmitted] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { getCourses().then(setCourses); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    const username = generateUsername(form.name);
    const password = 'lms' + Math.random().toString(36).slice(2, 7);
    try {
      const email = `${username}@lms.app`;
      await supabase.auth.signUp({ email, password, options: { data: { username, name: form.name, role: 'student' } } });
    } catch {}
    setCredentials({ username, password });
    setSubmitted(true);
  };

  const copyCredentials = () => {
    navigator.clipboard?.writeText(`Username: ${credentials.username}\nPassword: ${credentials.password}`);
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
            <p className="text-xs text-indigo-600 mb-3">Share these credentials with the student.</p>
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

function StudentProfile({ student, onBack }) {
  if (!student) return <div className="p-6 text-gray-400">Select a student to view profile.</div>;
  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>
      <div className="card p-6 space-y-4">
        <h2 className="text-xl font-semibold">{student.name}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Email:</span> <span className="font-medium">{student.email}</span></div>
          <div><span className="text-gray-500">Course:</span> <span className="font-medium">{student.course || '-'}</span></div>
          <div><span className="text-gray-500">Status:</span> <span className={`badge ${student.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{student.status}</span></div>
          <div><span className="text-gray-500">Enrolled:</span> <span className="font-medium">{student.enrolled || '-'}</span></div>
          <div><span className="text-gray-500">Progress:</span> <span className="font-medium">{student.progress || 0}%</span></div>
        </div>
      </div>
    </div>
  );
}

function StudentProgress({ students, onBack, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState('');

  async function handleSave(id) {
    await supabase.from('profiles').update({ progress: Number(editVal) }).eq('id', id);
    setEditingId(null);
    onRefresh();
  }

  async function handleDeleteProgress(id) {
    await supabase.from('profiles').update({ progress: 0 }).eq('id', id);
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>
      <h1 className="text-2xl font-bold text-gray-900">Student Progress</h1>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Name</th>
              <th className="table-header">Course</th>
              <th className="table-header">Progress</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell font-medium">{s.name}</td>
                <td className="table-cell">{s.course || '-'}</td>
                <td className="table-cell">
                  {editingId === s.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="100" value={editVal} onChange={e => setEditVal(e.target.value)} className="input-field w-20" />
                      <button onClick={() => handleSave(s.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full w-32 overflow-hidden">
                        <div className={`h-full rounded-full ${s.progress >= 70 ? 'bg-green-500' : s.progress >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.progress || 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{s.progress || 0}%</span>
                    </div>
                  )}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingId(s.id); setEditVal(String(s.progress || 0)); }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"><Save className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteProgress(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
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

function CredentialsModal({ student, onClose }) {
  const [newPassword, setNewPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const username = student.email
    ? student.email.split('@')[0]
    : student.name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');

  const handleReset = async () => {
    const password = newPassword || 'lms' + Math.random().toString(36).slice(2, 7);
    setResetting(true);
    try {
      await supabase.rpc('admin_reset_student_password', { student_id: student.id, new_password: password });
      setGeneratedPassword(password);
      setNewPassword('');
      setResetDone(true);
    } catch (err) {
      alert('Failed to reset password: ' + (err.message || err));
    }
    setResetting(false);
  };

  const copyPassword = () => {
    navigator.clipboard?.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Student Credentials</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Student</label>
            <p className="font-medium text-gray-900">{student.name}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500">Username</label>
            <p className="font-mono text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border">{username}</p>
          </div>
        </div>

        {resetDone && generatedPassword ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
              <Check className="w-4 h-4" /> Password Reset Successfully
            </div>
            <div>
              <label className="text-xs text-gray-500">New Password</label>
              <p className="font-mono text-sm text-gray-900 bg-white px-3 py-2 rounded-lg border mt-1 break-all">{generatedPassword}</p>
            </div>
            <button onClick={copyPassword} className="w-full flex items-center justify-center gap-2 text-sm text-green-700 bg-white border border-green-200 rounded-lg px-3 py-2 hover:bg-green-50 cursor-pointer">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy New Password'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">New Password (leave empty to auto-generate)</label>
              <input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Auto-generate if empty"
                className="input-field w-full mt-1"
              />
            </div>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              {resetting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        )}

        <button onClick={onClose} className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 cursor-pointer">Close</button>
      </div>
    </div>
  );
}

export default function StudentManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [credentialStudent, setCredentialStudent] = useState(null);

  useEffect(() => { loadStudents(); }, []);

  async function loadStudents() {
    setStudents(await getStudents());
  }

  const isAddPage = location.pathname.endsWith('/add');
  const isProfilePage = location.pathname.endsWith('/profile');
  const isProgressPage = location.pathname.endsWith('/progress');
  const isSuspendPage = location.pathname.endsWith('/suspend');

  useEffect(() => {
    if (isProfilePage && !selectedStudent && students.length > 0) {
      setSelectedStudent(students[0]);
    }
  }, [isProfilePage, students]);

  if (isAddPage) return <AddStudentForm onBack={() => navigate('/admin/students')} />;
  if (isProfilePage) return <StudentProfile student={selectedStudent} onBack={() => { setSelectedStudent(null); navigate('/admin/students'); }} />;
  if (isProgressPage) return <StudentProgress students={students} onBack={() => navigate('/admin/students')} onRefresh={loadStudents} />;
  if (isSuspendPage) return <Navigate to="/admin/students" replace />;

  const filtered = students.filter(s => {
    const matchSearch = (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.email || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statuses = ['All', ...new Set(students.map(s => s.status).filter(Boolean))];

  return (
    <div className="space-y-6">
      {credentialStudent && <CredentialsModal student={credentialStudent} onClose={() => setCredentialStudent(null)} />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <button onClick={() => navigate('/admin/students/add')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
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
                <td className="table-cell">
                  <button onClick={() => { setSelectedStudent(s); navigate('/admin/students/profile'); }} className="font-medium text-indigo-600 hover:text-indigo-800 text-left">{s.name}</button>
                </td>
                <td className="table-cell text-gray-500">{s.email}</td>
                <td className="table-cell">{s.course || '-'}</td>
                <td className="table-cell">
                  <span className={`badge ${s.status === 'Active' ? 'badge-success' : s.status === 'Suspended' ? 'badge-danger' : 'badge-warning'}`}>{s.status}</span>
                </td>
                <td className="table-cell">{s.enrolled || '-'}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden w-24">
                      <div className={`h-full rounded-full ${s.progress >= 70 ? 'bg-green-500' : s.progress >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.progress || 0}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8">{s.progress || 0}%</span>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedStudent(s); navigate('/admin/students/profile'); }} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View</button>
                    <button onClick={() => setCredentialStudent(s)} className="text-xs flex items-center gap-1 text-amber-600 hover:text-amber-800 font-medium">
                      <KeyRound className="w-3 h-3" /> Credentials
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
