import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, Link, X } from 'lucide-react';
import { getAssignments, getMySubmissions, submitAssignmentLink } from '../../data/dynamicStore';
import { useAuth } from '../../contexts/AuthContext';
import { showSuccess, showError } from '../../components/common/Toast';

const statusTabs = ['All', 'Pending', 'Submitted', 'Graded'];

export default function StudentAssignments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submitModal, setSubmitModal] = useState(null);
  const [linkValue, setLinkValue] = useState('');

  useEffect(() => {
    (async () => {
      setAssignments(await getAssignments());
    })();
  }, []);

  useEffect(() => {
    if (user?.id) {
      getMySubmissions(user.id).then(setSubmissions);
    }
  }, [user]);

  const merged = assignments.map(a => {
    const sub = submissions.find(s => s.assignment_id === a.id);
    return { ...a, submission: sub || null, status: sub?.grade != null ? 'Graded' : sub?.link ? 'Submitted' : 'Pending' };
  });

  const filtered = merged.filter(a => {
    if (activeTab === 'All') return true;
    return a.status === activeTab;
  });

  const handleSubmit = async () => {
    if (!linkValue.trim()) return;
    if (!linkValue.startsWith('http://') && !linkValue.startsWith('https://')) {
      return showError('Please enter a valid URL starting with http:// or https://');
    }
    try {
      await submitAssignmentLink(submitModal.id, user.id, linkValue.trim());
      showSuccess('Assignment submitted!');
      setSubmitModal(null);
      setLinkValue('');
      const updated = await getMySubmissions(user.id);
      setSubmissions(updated);
    } catch (err) {
      showError(err.message || 'Failed to submit');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
      </div>

      <div className="flex gap-2">
        {statusTabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Title</th>
              <th className="table-header">Course</th>
              <th className="table-header">Due Date</th>
              <th className="table-header">Status</th>
              <th className="table-header">Submission Link</th>
              <th className="table-header">Grade</th>
              <th className="table-header">Action</th>
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
                    {a.due_date}
                  </div>
                </td>
                <td className="table-cell">
                  <span className={`badge ${
                    a.status === 'Graded' ? 'badge-success' :
                    a.status === 'Submitted' ? 'badge-info' : 'badge-warning'
                  }`}>{a.status}</span>
                </td>
                <td className="table-cell max-w-[200px] truncate">
                  {a.submission?.link ? (
                    <a href={a.submission.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm flex items-center gap-1">
                      <Link className="w-3 h-3" /> {a.submission.link}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">--</span>
                  )}
                </td>
                <td className="table-cell">
                  {a.submission?.grade != null ? (
                    <span className="font-medium text-gray-900">{a.submission.grade}/100</span>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </td>
                <td className="table-cell">
                  {a.status === 'Pending' ? (
                    <button onClick={() => { setSubmitModal(a); setLinkValue(a.submission?.link || ''); }} className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5">
                      <Link className="w-3.5 h-3.5" /> Submit Link
                    </button>
                  ) : a.status === 'Submitted' ? (
                    <button onClick={() => { setSubmitModal(a); setLinkValue(a.submission?.link || ''); }} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5">
                      <Link className="w-3.5 h-3.5" /> Update
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" /> Graded
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No assignments found</p>
          </div>
        )}
      </div>

      {submitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Submit Assignment</h2>
              <button onClick={() => setSubmitModal(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500">
              <span className="font-medium">{submitModal.title}</span> — {submitModal.course}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Link</label>
              <input
                type="url"
                value={linkValue}
                onChange={e => setLinkValue(e.target.value)}
                className="input-field w-full"
                placeholder="https://drive.google.com/..."
              />
              <p className="text-xs text-gray-400 mt-1">Paste a Google Drive, GitHub, or any public URL</p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSubmitModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSubmit} className="btn-primary">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
