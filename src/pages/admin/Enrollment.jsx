import { useState } from 'react';
import { Check, X, Clock, UserPlus } from 'lucide-react';
import { students, courses, enrollmentRequests } from '../../data/mockData';

export default function Enrollment() {
  const [form, setForm] = useState({ name: '', email: '', course: '' });

  const handleSubmit = e => {
    e.preventDefault();
    setForm({ name: '', email: '', course: '' });
  };

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
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Enter student name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select
                required
                value={form.course}
                onChange={e => setForm({ ...form, course: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="">Select course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.title}>{c.title}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium">
              Enroll Student
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Pending Requests</h3>
            <span className="text-sm text-gray-500">{enrollmentRequests.length} requests</span>
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
              {enrollmentRequests.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="table-cell font-medium">{r.name}</td>
                  <td className="table-cell text-gray-500">{r.email}</td>
                  <td className="table-cell">{r.course}</td>
                  <td className="table-cell">{r.requested}</td>
                  <td className="table-cell">
                    <span className={`badge ${
                      r.status === 'Approved' ? 'badge-success' :
                      r.status === 'Rejected' ? 'badge-danger' :
                      'badge-warning'
                    }`}>{r.status}</span>
                  </td>
                  <td className="table-cell">
                    {r.status === 'Pending' ? (
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                          <Check className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
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
