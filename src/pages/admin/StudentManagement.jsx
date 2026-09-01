import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Search, Plus, ArrowLeft, UserPlus, Copy, Check, LogIn, Save, X, KeyRound, BookOpen, Trash2 } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { getAllStudents, getAllCourses, getAllTestSeries } from '../../data/dynamicStore';
import { apiUrl } from '../../data/api';
import { useAuth } from '../../contexts/AuthContext';
import { showError, showSuccess } from '../../components/common/Toast';
import { normalizeCourseAccessSelection, serializeCourseAccess, getCourseAccessLabel } from './studentCourseAccess';

function AddStudentForm({ onBack, onStudentAdded }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', course: '', enrolled: new Date().toISOString().split('T')[0] });
  const [submitted, setSubmitted] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { getAllCourses().then(setCourses).catch(err => console.error('Failed to load courses:', err)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/create-student'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email.trim().toLowerCase(),
          course: form.course || null,
          enrolled: form.enrolled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to add the student.');
      await onStudentAdded();
      setCredentials({ email: data.email, password: data.password });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || 'Unable to add the student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentials = () => {
    navigator.clipboard?.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickLogin = () => {
    logout();
    navigate(`/login?username=${encodeURIComponent(credentials.email)}&password=${encodeURIComponent(credentials.password)}`);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => { setSubmitted(false); setCredentials(null); }} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-green-600 dark:text-green-300" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Student Added Successfully!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{form.name} has been enrolled in {form.course}.</p>
          <div className="max-w-sm mx-auto bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3">Login Credentials</h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-300 mb-3">Share these credentials with the student.</p>
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg px-3 py-2 border border-indigo-100">
                <span className="text-xs text-gray-500 dark:text-gray-400">Login email</span>
                <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 break-all">{credentials.email}</span>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg px-3 py-2 border border-indigo-100">
                <span className="text-xs text-gray-500 dark:text-gray-400">Password</span>
                <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{credentials.password}</span>
              </div>
            </div>
            <button onClick={copyCredentials} className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-800 border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-500/15 transition-colors cursor-pointer">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Credentials'}
            </button>
            <button onClick={quickLogin} className="mt-2 w-full flex items-center justify-center gap-2 text-sm text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-800 border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-500/15 transition-colors cursor-pointer">
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
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Add New Student</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fill in the details to enroll a new student — credentials will be auto-generated</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {submitError && <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{submitError}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Enter full name" className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Enter email address" className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course</label>
            <select value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))} className="input-field">
              {courses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enrollment Date</label>
            <input type="date" value={form.enrolled} onChange={e => setForm(p => ({ ...p, enrolled: e.target.value }))} className="input-field" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">{isSubmitting ? 'Enrolling...' : 'Enroll Student'}</button>
            <button type="button" onClick={onBack} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StudentProfile({ student, onBack, onSaved }) {
  const [form, setForm] = useState({
    name: student?.name || '',
    email: student?.email || '',
    course: student?.course || '',
    status: student?.status || 'Active',
    enrolled: student?.enrolled || '',
    progress: student?.progress || 0,
  });
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllCourses().then(setCourses).catch(err => console.error('Failed to load courses:', err));
  }, []);

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name || '',
        email: student.email || '',
        course: student.course || '',
        status: student.status || 'Active',
        enrolled: student.enrolled || '',
        progress: student.progress || 0,
      });
    }
  }, [student]);

  const toggleCourse = (courseTitle) => {
    const selected = normalizeCourseAccessSelection(form.course);
    const next = selected.includes(courseTitle)
      ? selected.filter(item => item !== courseTitle)
      : [...selected, courseTitle];
    setForm(prev => ({ ...prev, course: serializeCourseAccess(next) }));
  };

  const handleSave = async () => {
    if (!student) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        name: form.name,
        email: form.email,
        course: form.course || null,
        status: form.status,
        enrolled: form.enrolled,
        progress: Number(form.progress),
      }).eq('id', student.id);
      if (error) throw error;
      showSuccess('Student profile updated.');
      await onSaved();
      onBack();
    } catch (error) {
      showError(error.message || 'Unable to update student profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!student) return <div className="p-6 text-gray-400 dark:text-gray-500">Select a student to view profile.</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>

      <div className="card p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Edit Student</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update student details and course access.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))} className="input-field">
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enrolled Date</label>
            <input type="date" value={form.enrolled} onChange={e => setForm(prev => ({ ...prev, enrolled: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Progress (%)</label>
            <input type="number" min="0" max="100" value={form.progress} onChange={e => setForm(prev => ({ ...prev, progress: e.target.value }))} className="input-field" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="mb-3 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Access</label>
            <span className="text-xs text-gray-500 dark:text-gray-400">{getCourseAccessLabel(form.course)}</span>
          </div>
          <div className="grid gap-2">
            {courses.map(item => {
              const checked = normalizeCourseAccessSelection(form.course).includes(item.title);
              return (
                <label key={item.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.title}</span>
                  <input type="checkbox" checked={checked} onChange={() => toggleCourse(item.title)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
          <button onClick={onBack} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function StudentProgress({ students, onBack, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState('');

  async function handleSave(id) {
    const { error } = await supabase.from('profiles').update({ progress: Number(editVal) }).eq('id', id);
    if (error) return showError(error.message || 'Failed to update progress.');
    setEditingId(null);
    onRefresh();
  }

  async function handleDeleteProgress(id) {
    const { error } = await supabase.from('profiles').update({ progress: 0 }).eq('id', id);
    if (error) return showError(error.message || 'Failed to reset progress.');
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Student Progress</h1>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
              <th className="table-header">Name</th>
              <th className="table-header">Course</th>
              <th className="table-header">Progress</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="table-cell font-medium">{s.name}</td>
                <td className="table-cell">{s.course || '-'}</td>
                <td className="table-cell">
                  {editingId === s.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="100" value={editVal} onChange={e => setEditVal(e.target.value)} className="input-field w-20" />
                      <button onClick={() => handleSave(s.id)} className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-32 overflow-hidden">
                        <div className={`h-full rounded-full ${s.progress >= 70 ? 'bg-green-500' : s.progress >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.progress || 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{s.progress || 0}%</span>
                    </div>
                  )}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingId(s.id); setEditVal(String(s.progress || 0)); }} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg cursor-pointer"><Save className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteProgress(s.id)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
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
      const { error } = await supabase.rpc('admin_reset_student_password', {
        student_id: student.id,
        new_password: password,
      });
      if (error) throw error;
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
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Student Credentials</h2>
          <button onClick={onClose} className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Student</label>
            <p className="font-medium text-gray-900 dark:text-gray-100">{student.name}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Username</label>
            <p className="font-mono text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 rounded-lg border">{username}</p>
          </div>
        </div>

        {resetDone && generatedPassword ? (
          <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium text-sm">
              <Check className="w-4 h-4" /> Password Reset Successfully
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">New Password</label>
              <p className="font-mono text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border mt-1 break-all">{generatedPassword}</p>
            </div>
            <button onClick={copyPassword} className="w-full flex items-center justify-center gap-2 text-sm text-green-700 dark:text-green-300 bg-white dark:bg-gray-800 border border-green-200 rounded-lg px-3 py-2 hover:bg-green-50 dark:hover:bg-green-500/10 cursor-pointer">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy New Password'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">New Password (leave empty to auto-generate)</label>
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

        <button onClick={onClose} className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2 cursor-pointer">Close</button>
      </div>
    </div>
  );
}

function normalizeTestSeriesAccess(value) {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}
function serializeTestSeriesAccess(arr) {
  return arr.filter(Boolean).join(', ');
}

function CourseAccessModal({ student, courses, onClose, onSaved }) {
  const [selectedCourses, setSelectedCourses] = useState(() => normalizeCourseAccessSelection(student.course || ''));
  const [testSeries, setTestSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(() => normalizeTestSeriesAccess(student.test_series_access || ''));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllTestSeries().then(list => setTestSeries(list.filter(s => !s.is_free))).catch(() => {});
  }, []);

  const toggleCourse = (courseTitle) => {
    setSelectedCourses(prev =>
      prev.includes(courseTitle) ? prev.filter(item => item !== courseTitle) : [...prev, courseTitle]
    );
  };

  const toggleSeries = (name) => {
    setSelectedSeries(prev =>
      prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]
    );
  };

  const saveAccess = async () => {
    setSaving(true);
    const courseStr = serializeCourseAccess(selectedCourses);
    const seriesStr = serializeTestSeriesAccess(selectedSeries);
    const { error } = await supabase.from('profiles').update({
      course: courseStr || null,
      test_series_access: seriesStr || null,
    }).eq('id', student.id);
    setSaving(false);
    if (error) return showError(error.message || 'Unable to update access.');
    showSuccess('Student access updated.');
    await onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg space-y-5 rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manage Access</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{student.name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="mb-3 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Access</label>
            <span className="text-xs text-gray-500 dark:text-gray-400">{getCourseAccessLabel(serializeCourseAccess(selectedCourses))}</span>
          </div>
          <div className="grid gap-2">
            {courses.map(item => {
              const checked = selectedCourses.includes(item.title);
              return (
                <label key={item.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.title}</span>
                  <input type="checkbox" checked={checked} onChange={() => toggleCourse(item.title)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                </label>
              );
            })}
            {courses.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500">No courses available</p>}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="mb-3 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Test Series Access</label>
            <span className="text-xs text-gray-500 dark:text-gray-400">{selectedSeries.length ? selectedSeries.join(', ') : 'None'}</span>
          </div>
          <div className="grid gap-2">
            {testSeries.map(ts => {
              const checked = selectedSeries.includes(ts.name);
              return (
                <label key={ts.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ts.name}</span>
                  <input type="checkbox" checked={checked} onChange={() => toggleSeries(ts.name)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                </label>
              );
            })}
            {testSeries.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500">No test series available</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={saveAccess} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving...' : 'Save Access'}</button>
        </div>
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
  const [courseStudent, setCourseStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [deleteStudent, setDeleteStudent] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadStudents(); }, []);

  async function loadStudents() {
    try {
      setStudents(await getAllStudents());
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  }

  async function openCourseAccess(student) {
    try {
      setCourses(await getAllCourses());
      setCourseStudent(student);
    } catch (error) {
      showError(error.message || 'Unable to load courses.');
    }
  }

  async function handleDeleteStudent() {
    if (!deleteStudent) return;
    setDeleting(true);
    try {
      try {
        const { error } = await supabase.rpc('admin_delete_student', { student_id: deleteStudent.id });
        if (error) {
          const { error: directErr } = await supabase.from('profiles').delete().eq('id', deleteStudent.id);
          if (directErr) throw directErr;
        }
      } catch {
        const { error: directErr } = await supabase.from('profiles').delete().eq('id', deleteStudent.id);
        if (directErr) throw directErr;
      }
      showSuccess(`${deleteStudent.name} has been deleted.`);
      setDeleteStudent(null);
      await loadStudents();
    } catch (err) {
      showError(err.message || 'Failed to delete student.');
    }
    setDeleting(false);
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

  if (isAddPage) return <AddStudentForm onBack={() => navigate('/admin/students')} onStudentAdded={loadStudents} />;
  if (isProfilePage) return <StudentProfile student={selectedStudent} onBack={() => { setSelectedStudent(null); navigate('/admin/students'); }} onSaved={loadStudents} />;
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
      {courseStudent && <CourseAccessModal student={courseStudent} courses={courses} onClose={() => setCourseStudent(null)} onSaved={loadStudents} />}
      {deleteStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Student</h2>
              <button onClick={() => setDeleteStudent(null)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to permanently delete <span className="font-semibold text-gray-900 dark:text-gray-100">{deleteStudent.name}</span>?
              This will remove the student's account and all related data. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteStudent(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDeleteStudent} disabled={deleting} className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60 cursor-pointer">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Student Management</h1>
        <button onClick={() => navigate('/admin/students/add')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:bg-gray-800 dark:text-gray-100" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-100 w-full sm:w-auto">
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
              <th className="table-header">Name</th>
              <th className="table-header">Email</th>
              <th className="table-header">Course</th>
              <th className="table-header">Status</th>
              <th className="table-header">Enrolled Date</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="table-cell">
                  <button onClick={() => { setSelectedStudent(s); navigate('/admin/students/profile'); }} className="font-medium text-indigo-600 hover:text-indigo-800 text-left">{s.name}</button>
                </td>
                <td className="table-cell text-gray-500 dark:text-gray-400">{s.email}</td>
                <td className="table-cell">{getCourseAccessLabel(s.course || '')}</td>
                <td className="table-cell">
                  <span className={`badge ${s.status === 'Active' ? 'badge-success' : s.status === 'Suspended' ? 'badge-danger' : 'badge-warning'}`}>{s.status}</span>
                </td>
                <td className="table-cell">{s.enrolled || '-'}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedStudent(s); navigate('/admin/students/profile'); }} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View</button>
                    <button onClick={() => setCredentialStudent(s)} className="text-xs flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 font-medium">
                      <KeyRound className="w-3 h-3" /> Credentials
                    </button>
                    <button onClick={() => openCourseAccess(s)} className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 font-medium">
                      <BookOpen className="w-3 h-3" /> Course
                    </button>
                    <button onClick={() => setDeleteStudent(s)} className="text-xs flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-800 font-medium">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
