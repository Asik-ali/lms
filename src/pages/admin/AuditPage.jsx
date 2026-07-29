import { useState, useEffect } from 'react';
import { getAuditLogs } from '../../data/dynamicStore';
import { Search } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLogs(await getAuditLogs({ entity: entityFilter || undefined, action: actionFilter || undefined, limit: 200 }));
  }

  useEffect(() => { load(); }, [entityFilter, actionFilter]);

  const filtered = logs.filter(l =>
    l.description.toLowerCase().includes(search.toLowerCase()) ||
    l.username.toLowerCase().includes(search.toLowerCase())
  );

  const entities = [...new Set(logs.map(l => l.entity))];
  const actions = [...new Set(logs.map(l => l.action))];

  const badgeColor = (action) => {
    if (action === 'CREATE' || action === 'REGISTER') return 'bg-green-100 text-green-700';
    if (action === 'UPDATE' || action === 'LOGIN') return 'bg-blue-100 text-blue-700';
    if (action === 'DELETE') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="input-field w-40">
          <option value="">All entities</option>
          {entities.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="input-field w-40">
          <option value="">All actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="table-header">Time</th>
                <th className="table-header">User</th>
                <th className="table-header">Role</th>
                <th className="table-header">Action</th>
                <th className="table-header">Entity</th>
                <th className="table-header">Description</th>
                <th className="table-header">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="table-cell text-sm text-gray-500 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="table-cell font-medium">{l.username}</td>
                  <td className="table-cell">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{l.userRole}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor(l.action)}`}>{l.action}</span>
                  </td>
                  <td className="table-cell text-gray-500">{l.entity}{l.entityId ? ` #${l.entityId}` : ''}</td>
                  <td className="table-cell max-w-xs truncate" title={l.description}>{l.description}</td>
                  <td className="table-cell text-xs text-gray-400 font-mono">{l.ip || '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
