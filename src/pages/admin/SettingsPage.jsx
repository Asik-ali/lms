import { useState } from 'react';
import { Settings, Shield, Mail, Key, Database, Save, Plus, Trash2, Copy, Download, Upload } from 'lucide-react';

const tabs = [
  { label: 'General', icon: Settings },
  { label: 'Roles & Permissions', icon: Shield },
  { label: 'SMTP', icon: Mail },
  { label: 'API Keys', icon: Key },
  { label: 'Backup & Restore', icon: Database },
];

const roles = [
  { name: 'Admin', permissions: { manage_users: true, manage_courses: true, manage_settings: true, view_reports: true } },
  { name: 'Instructor', permissions: { manage_users: false, manage_courses: true, manage_settings: false, view_reports: true } },
  { name: 'Student', permissions: { manage_users: false, manage_courses: false, manage_settings: false, view_reports: false } },
];

const permissionLabels = {
  manage_users: 'Manage Users',
  manage_courses: 'Manage Courses',
  manage_settings: 'Manage Settings',
  view_reports: 'View Reports',
};

const apiKeys = [
  { id: 1, name: 'Production API Key', key: 'pk_live_xxxxxxxxxxxx', created: '2026-01-15', status: 'Active' },
  { id: 2, name: 'Test API Key', key: 'pk_test_xxxxxxxxxxxx', created: '2026-03-20', status: 'Active' },
];

function GeneralTab() {
  const [siteName, setSiteName] = useState('LMS Platform');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');

  return (
    <div className="card">
      <div className="card-header"><h3 className="text-lg font-semibold">General Settings</h3></div>
      <div className="p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
          <input type="text" value={siteName} onChange={e => setSiteName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">Logo</div>
            <button className="btn-secondary">Upload</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select value={timezone} onChange={e => setTimezone(e.target.value)} className="input-field">
            <option value="UTC">UTC</option>
            <option value="EST">Eastern (EST)</option>
            <option value="PST">Pacific (PST)</option>
            <option value="IST">India (IST)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)} className="input-field">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
        <button className="flex items-center gap-2 btn-primary"><Save className="w-4 h-4" />Save Settings</button>
      </div>
    </div>
  );
}

function RolesTab() {
  const [rolesState, setRolesState] = useState(roles);

  const togglePermission = (roleIdx, perm) => {
    setRolesState(prev => prev.map((r, i) => i === roleIdx ? { ...r, permissions: { ...r.permissions, [perm]: !r.permissions[perm] } } : r));
  };

  return (
    <div className="space-y-4">
      {rolesState.map((role, idx) => (
        <div key={role.name} className="card">
          <div className="card-header"><h3 className="text-lg font-semibold">{role.name}</h3></div>
          <div className="p-6 space-y-3">
            {Object.entries(permissionLabels).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={role.permissions[key]} onChange={() => togglePermission(idx, key)} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <button className="flex items-center gap-2 btn-primary"><Save className="w-4 h-4" />Save Permissions</button>
    </div>
  );
}

function SMTPTab() {
  const [host, setHost] = useState('smtp.example.com');
  const [port, setPort] = useState('587');
  const [username, setUsername] = useState('noreply@example.com');
  const [password, setPassword] = useState('');

  return (
    <div className="card">
      <div className="card-header"><h3 className="text-lg font-semibold">SMTP Configuration</h3></div>
      <div className="p-6 space-y-4 max-w-xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
            <input type="text" value={host} onChange={e => setHost(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
            <input type="text" value={port} onChange={e => setPort(e.target.value)} className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter SMTP password" className="input-field" />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 btn-primary"><Save className="w-4 h-4" />Save SMTP</button>
          <button className="btn-secondary">Test Connection</button>
        </div>
      </div>
    </div>
  );
}

function ApiKeysTab() {
  const [keys, setKeys] = useState(apiKeys);

  const deleteKey = (id) => setKeys(prev => prev.filter(k => k.id !== id));

  return (
    <div className="space-y-4">
      <button className="flex items-center gap-2 btn-primary"><Plus className="w-4 h-4" />Generate New Key</button>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Name</th>
              <th className="table-header">API Key</th>
              <th className="table-header">Created</th>
              <th className="table-header">Status</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell font-medium">{k.name}</td>
                <td className="table-cell">
                  <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{k.key}</code>
                </td>
                <td className="table-cell text-gray-500">{k.created}</td>
                <td className="table-cell"><span className="badge-success">{k.status}</span></td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Copy className="w-4 h-4" /></button>
                    <button onClick={() => deleteKey(k.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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

function BackupTab() {
  const [schedule, setSchedule] = useState('daily');

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header"><h3 className="text-lg font-semibold">Backup Schedule</h3></div>
        <div className="p-6 space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Frequency</label>
            <select value={schedule} onChange={e => setSchedule(e.target.value)} className="input-field">
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <button className="flex items-center gap-2 btn-primary"><Save className="w-4 h-4" />Save Schedule</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="text-lg font-semibold">Manual Backup</h3></div>
        <div className="p-6 flex items-center gap-3">
          <button className="flex items-center gap-2 btn-primary"><Download className="w-4 h-4" />Create Backup Now</button>
          <span className="text-sm text-gray-400">Last backup: 2026-07-28 03:00 AM</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="text-lg font-semibold">Restore</h3></div>
        <div className="p-6 space-y-4 max-w-xl">
          <p className="text-sm text-gray-600">Restore the system from a previous backup file.</p>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 btn-secondary"><Upload className="w-4 h-4" />Choose Backup File</button>
            <button className="btn-primary">Restore</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  i === activeTab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 0 && <GeneralTab />}
      {activeTab === 1 && <RolesTab />}
      {activeTab === 2 && <SMTPTab />}
      {activeTab === 3 && <ApiKeysTab />}
      {activeTab === 4 && <BackupTab />}
    </div>
  );
}
