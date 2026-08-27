import { useState, useEffect } from 'react';
import { Check, X, Clock, UserPlus } from 'lucide-react';
import { getAllCourses, getAllEnrollments, addEnrollment, updateEnrollment } from '../../data/dynamicStore';

export default function Enrollment() {
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', course: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setCourses(await getAllCourses());
    setRequests(await getAllEnrollments());
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.course) return;
    await addEnrollment({ name: form.name, email: form.email, course: form.course, requested: new Date().toISOString().split('T')[0], status: 'Pending' });
    setForm({ name: '', email: '', course: '' });
    load();
  };

  const handleApprove = async (id) => {
    await updateEnrollment(id, { status: 'Approved' });
    load();
  };

  const handleReject = async (id) => {
    await updateEnrollment(id, { status: 'Rejected' });
    load();
  };

  const pending = requests.filter(r => r.status === 'Pending');
  const allRequests = [...requests].reverse();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Enrollment Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold">New Enrollment</h3>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field w-full" placeholder="Enter student name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field w-full" placeholder="Enter email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select required value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} className="input-field w-full">
                <option value="">Select course</option>
                {courses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium cursor-pointer">Enroll Student</button>
          </form>
        </div>

        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Enrollment Requests</h3>
            <span className="text-sm text-gray-500">{allRequests.length} total, {pending.length} pending</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Course</th>
                <th className="table-header">Requested</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allRequests.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="table-cell font-medium">{r.name}</td>
                  <td className="table-cell text-gray-500">{r.email}</td>
                  <td className="table-cell">{r.course}</td>
                  <td className="table-cell">{r.requested}</td>
                  <td className="table-cell">
                    <span className={`badge ${r.status === 'Approved' ? 'badge-success' : r.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{r.status}</span>
                  </td>
                  <td className="table-cell">
                    {r.status === 'Pending' ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleApprove(r.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer"><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleReject(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {allRequests.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No enrollment requests yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
