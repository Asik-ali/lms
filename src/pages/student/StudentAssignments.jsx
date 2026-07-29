import { useState } from 'react';
import { FileText, Clock, Upload, CheckCircle } from 'lucide-react';
import { studentAssignments } from '../../data/mockData';

const statusTabs = ['All', 'Pending', 'Submitted', 'Graded'];

export default function StudentAssignments() {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = studentAssignments.filter(a => {
    if (activeTab === 'All') return true;
    return a.status === activeTab;
  });

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
                    {a.dueDate}
                  </div>
                </td>
                <td className="table-cell">
                  <span className={`badge ${
                    a.status === 'Graded' ? 'badge-success' :
                    a.status === 'Submitted' ? 'badge-info' : 'badge-warning'
                  }`}>{a.status}</span>
                </td>
                <td className="table-cell">
                  {a.grade !== null ? (
                    <span className="font-medium text-gray-900">{a.grade}/100</span>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </td>
                <td className="table-cell">
                  {a.status === 'Pending' ? (
                    <button className="btn-primary flex items-center gap-1.5 text-xs">
                      <Upload className="w-3.5 h-3.5" /> Upload
                    </button>
                  ) : a.status === 'Submitted' ? (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Submitted
                    </span>
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
      </div>

      {activeTab === 'Pending' && filtered.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Upload Assignment</h3>
          </div>
          <div className="p-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Drag and drop your file here, or</p>
              <button className="btn-secondary mt-2">Browse Files</button>
              <p className="text-xs text-gray-400 mt-2">PDF, DOC, DOCX up to 10MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
