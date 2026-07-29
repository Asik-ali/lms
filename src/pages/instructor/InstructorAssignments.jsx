import { useState, useEffect } from 'react';
import { Plus, FileText, Clock, X, CheckCircle } from 'lucide-react';
import { getCourses, getAssignments, addAssignment } from '../../data/dynamicStore';
import { useAuth } from '../../contexts/AuthContext';

export default function InstructorAssignments() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', course: '', dueDate: '' });

  useEffect(() => {
    (async () => {
      setCourses(await getCourses());
      setAssignments(await getAssignments());
    })();
  }, []);

  const instructorName = user?.name || 'Instructor';
  const instructorCourses = courses.filter(c => c.instructor === instructorName);
  const filtered = assignments.filter(a => instructorCourses.some(c => c.title === a.course));

  const handleCreate = async () => {
    if (!newAssignment.title || !newAssignment.course || !newAssignment.dueDate) return;
    await addAssignment({
      title: newAssignment.title,
      course: newAssignment.course,
      due_date: newAssignment.dueDate,
      dueDate: newAssignment.dueDate,
      submissions: 0,
      total: 0,
      status: 'Active',
    });
    setAssignments(await getAssignments());
    setNewAssignment({ title: '', course: '', dueDate: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create New Assignment
        </button>
      </div>

      {showForm && (
        <div className="card p-6 border-indigo-200 bg-indigo-50/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">New Assignment</h3>
            <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" placeholder="Assignment title" value={newAssignment.title} onChange={e => setNewAssignment(prev => ({ ...prev, title: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select value={newAssignment.course} onChange={e => setNewAssignment(prev => ({ ...prev, course: e.target.value }))} className="input-field w-full">
                <option value="">Select course</option>
                {instructorCourses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={newAssignment.dueDate} onChange={e => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))} className="input-field w-full" />
            </div>
          </div>
          <button onClick={handleCreate} className="btn-primary cursor-pointer">Create Assignment</button>
        </div>
      )}

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
                    <Clock className="w-3.5 h-3.5" />{a.due_date || a.dueDate}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[80px]">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(a.submissions || 0) > 0 ? (a.submissions / (a.total || 1)) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{a.submissions}/{a.total}</span>
                  </div>
                </td>
                <td className="table-cell">
                  <span className={`badge ${a.status === 'Active' ? 'badge-info' : 'badge-success'}`}>{a.status}</span>
                </td>
                <td className="table-cell">
                  <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 cursor-pointer"><CheckCircle className="w-3.5 h-3.5" /> Grade</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No assignments yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
