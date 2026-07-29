import { useState, useEffect } from 'react';
import { getAttendance, addAttendance, updateAttendance, getCourses, getStudents } from '../../data/dynamicStore';

const initialForm = { name: '', course: '', present: '', total: '' };

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterCourse, setFilterCourse] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setRecords(await getAttendance());
    setCourses(await getCourses());
    setStudents(await getStudents());
  }

  const courseTitles = courses.map(c => c.title);
  const studentNames = students.map(s => s.name);

  const courseList = ['All', ...courseTitles];

  const filtered = filterCourse === 'All'
    ? records
    : records.filter(r => r.course === filterCourse);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function openAddForm() {
    setEditId(null);
    setForm(initialForm);
    setShowForm(true);
  }

  function openEditForm(rec) {
    setEditId(rec.id);
    setForm({ name: rec.name, course: rec.course, present: String(rec.present), total: String(rec.total) });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(initialForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const present = Number(form.present);
    const total = Number(form.total);
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    if (editId) {
      await updateAttendance(editId, { present, total, percentage });
    } else {
      await addAttendance({ name: form.name, course: form.course, present, total, percentage });
    }

    setRecords([...(await getAttendance())]);
    cancelForm();
  }

  const presentNum = Number(form.present) || 0;
  const totalNum = Number(form.total) || 0;
  const calcPercentage = totalNum > 0 ? Math.round((presentNum / totalNum) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
        <button onClick={openAddForm} className="btn btn-primary">
          Mark Attendance
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editId ? 'Edit Attendance' : 'Mark Attendance'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Student Name</label>
                {editId ? (
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input-field w-full"
                    required
                    readOnly
                  />
                ) : (
                  <select
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select student</option>
                    {studentNames.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="label">Course</label>
                <select
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                  className="input-field w-full"
                  required
                >
                  <option value="">Select course</option>
                  {courseTitles.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Present</label>
                  <input
                    type="number"
                    name="present"
                    min="0"
                    value={form.present}
                    onChange={handleChange}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label className="label">Total</label>
                  <input
                    type="number"
                    name="total"
                    min="1"
                    value={form.total}
                    onChange={handleChange}
                    className="input-field w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Percentage (auto-calculated)</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${calcPercentage >= 80 ? 'bg-green-500' : calcPercentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${calcPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                    {calcPercentage}%
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={cancelForm} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>
        <div className="p-6 flex flex-wrap items-center gap-4">
          <select
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
            className="input-field w-48"
          >
            {courseList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Name</th>
              <th className="table-header">Course</th>
              <th className="table-header">Present / Total</th>
              <th className="table-header">Percentage</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell font-medium">{r.name}</td>
                <td className="table-cell">{r.course}</td>
                <td className="table-cell">{r.present} / {r.total}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-3 max-w-xs">
                    <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${r.percentage >= 80 ? 'bg-green-500' : r.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium w-10 text-right ${r.percentage >= 80 ? 'text-green-600' : r.percentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {r.percentage}%
                    </span>
                  </div>
                </td>
                <td className="table-cell">
                  <button onClick={() => openEditForm(r)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
