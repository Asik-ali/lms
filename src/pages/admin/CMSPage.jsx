import { useState } from 'react';
import { Edit2, Eye, ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import { cmsPages } from '../../data/mockData';

export default function CMSPage() {
  const [expandedId, setExpandedId] = useState(null);
  const [editData, setEditData] = useState({});
  const [pages, setPages] = useState(cmsPages);

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setEditData({});
    } else {
      const page = pages.find(p => p.id === id);
      setExpandedId(id);
      setEditData({ title: page.title, content: page.content || '' });
    }
  };

  const saveEdit = (id) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, title: editData.title, updated: new Date().toISOString().slice(0, 10) } : p));
    setExpandedId(null);
    setEditData({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">CMS Pages</h1>
        <button className="btn-primary">Add New Page</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header w-10"></th>
              <th className="table-header">Page Title</th>
              <th className="table-header">Status</th>
              <th className="table-header">Last Updated</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map(p => (
              <>
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(p.id)}>
                  <td className="table-cell">
                    {expandedId === p.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </td>
                  <td className="table-cell font-medium">{p.title}</td>
                  <td className="table-cell">
                    <span className={`badge ${p.status === 'Published' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span>
                  </td>
                  <td className="table-cell text-gray-500">{p.updated}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" onClick={e => { e.stopPropagation(); toggleExpand(p.id); }}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={e => e.stopPropagation()}>
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === p.id && (
                  <tr key={`${p.id}-editor`}>
                    <td colSpan={5} className="bg-gray-50 p-6">
                      <div className="space-y-4 max-w-2xl">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                          <input type="text" value={editData.title || ''} onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))} className="input-field" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                          <textarea rows={6} value={editData.content || ''} onChange={e => setEditData(prev => ({ ...prev, content: e.target.value }))} className="input-field resize-none font-mono text-sm" placeholder="HTML content..." />
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => saveEdit(p.id)} className="flex items-center gap-2 btn-primary">
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button onClick={() => { setExpandedId(null); setEditData({}); }} className="flex items-center gap-2 btn-secondary">
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
