import { useState } from 'react';
import { Download, Plus, FileText } from 'lucide-react';
import { certificates } from '../../data/mockData';

export default function CertificatesPage() {
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Certificate Management</h1>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Create Template</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
              <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. Completion Certificate" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={templateDesc} onChange={e => setTemplateDesc(e.target.value)} placeholder="Brief description" className="input-field" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 btn-primary">
              <Plus className="w-4 h-4" />
              Create Template
            </button>
            <button className="flex items-center gap-2 btn-secondary">
              <FileText className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Student</th>
              <th className="table-header">Course</th>
              <th className="table-header">Issue Date</th>
              <th className="table-header">Type</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map(c => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell font-medium">{c.name}</td>
                <td className="table-cell">{c.course}</td>
                <td className="table-cell">{c.issued}</td>
                <td className="table-cell">
                  <span className={`badge ${c.type === 'Excellence' ? 'badge-success' : 'badge-info'}`}>{c.type}</span>
                </td>
                <td className="table-cell">
                  <button className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700">
                    <Download className="w-4 h-4" />
                    Download
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
