import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, Database, Save, Download, Upload, Loader, MailCheck, ClipboardPaste, Eye } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { getSmtpSettings, saveSmtpSettings } from '../../data/dynamicStore';
import { showError, showSuccess } from '../../components/common/Toast';

const tabs = [
  { label: 'SMTP', icon: Mail },
  { label: 'Backup & Restore', icon: Database },
];

function SMTPTab() {
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState('587');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [senderName, setSenderName] = useState('LMS Platform');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const settings = await getSmtpSettings();
        if (settings) {
          setHost(settings.host);
          setPort(String(settings.port));
          setUsername(settings.username);
          setPassword(settings.password);
          setSenderName(settings.sender_name);
        }
      } catch (err) {
        console.error('Failed to load SMTP settings:', err);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSmtpSettings({ host, port: Number(port), username, password, sender_name: senderName });
      showSuccess('SMTP settings saved.');
    } catch (err) {
      showError(err.message || 'Failed to save SMTP settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          recipient: username,
          subject: 'Test email from LMS',
          message: 'This is a test email to confirm your SMTP configuration is working.',
          smtpConfig: { host, port: Number(port), username, password, sender_name: senderName },
        }),
      });
      const data = await res.json();
      if (res.ok) showSuccess('Test email sent! Check your inbox.');
      else showError(data.error || 'Connection failed.');
    } catch (err) {
      showError(err.message || 'Could not connect to the server.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="card p-8 text-center text-gray-500"><Loader className="w-5 h-5 mx-auto mb-2 animate-spin" />Loading...</div>;
  }

  return (
    <div className="card">
      <div className="card-header"><h3 className="text-lg font-semibold">SMTP Configuration</h3></div>
      <div className="p-6 space-y-4 max-w-xl">
        <p className="text-sm text-gray-500">Configure your Gmail SMTP to send email notifications. Use an <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noreferrer" className="text-indigo-600 underline">App Password</a> if you have 2FA enabled.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
            <input type="text" value={host} onChange={e => setHost(e.target.value)} className="input-field" placeholder="smtp.gmail.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
            <input type="text" value={port} onChange={e => setPort(e.target.value)} className="input-field" placeholder="587" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (Username)</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input-field" placeholder="your-email@gmail.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">App Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your Gmail App Password" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
          <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)} className="input-field" placeholder="LMS Platform" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 btn-primary disabled:opacity-60">
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save SMTP'}
          </button>
          <button onClick={handleTest} disabled={testing || !username || !password} className="btn-secondary disabled:opacity-50">
            {testing ? 'Sending...' : 'Test Connection'}
          </button>
        </div>
      </div>
    </div>
  );
}

const backupTables = [
  'categories', 'courses', 'course_pdfs', 'course_lessons',
  'assignments', 'assignment_submissions', 'quizzes', 'questions', 'attendance',
  'announcements', 'enrollments', 'notifications', 'live_classes',
  'smtp_settings', 'tickets', 'ticket_replies', 'calendar_events',
  'test_series', 'test_categories', 'tests', 'test_attempts', 'test_responses',
  'question_reports',
];

function BackupTab() {
  const [schedule, setSchedule] = useState(() => localStorage.getItem('backupSchedule') || 'daily');
  const [lastBackup, setLastBackup] = useState(() => localStorage.getItem('lastBackup') || 'No backup created yet');
  const [backupFile, setBackupFile] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [pasteJson, setPasteJson] = useState('');
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const settings = await getSmtpSettings();
        if (settings?.username) setAdminEmail(settings.username);
      } catch (err) {
        console.error('Failed to load SMTP email:', err);
      }
    })();
  }, []);

  const saveSchedule = () => {
    localStorage.setItem('backupSchedule', schedule);
    showSuccess('Backup schedule saved.');
  };

  const createBackup = async () => {
    setIsWorking(true);
    try {
      const entries = await Promise.all(backupTables.map(async (table) => {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;
        return [table, data || []];
      }));
      const createdAt = new Date().toISOString();
      const backup = { version: 1, type: 'lms-backup', createdAt, tables: Object.fromEntries(entries) };
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `lms-backup-${createdAt.slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      const label = new Date().toLocaleString();
      localStorage.setItem('lastBackup', label);
      setLastBackup(label);
      showSuccess('Backup downloaded successfully.');
    } catch (error) {
      showError(error.message || 'Unable to create the backup.');
    } finally {
      setIsWorking(false);
    }
  };

  const sendBackupEmail = async () => {
    if (!adminEmail) return showError('Enter an admin email to send the backup to.');
    setIsSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipient: adminEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        const label = new Date().toLocaleString();
        localStorage.setItem('lastBackup', label);
        setLastBackup(label);
        showSuccess('Backup emailed to ' + adminEmail);
      } else {
        showError(data.error || 'Failed to send backup email.');
      }
    } catch (err) {
      showError(err.message || 'Could not reach the backup server.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePasteChange = (value) => {
    setPasteJson(value);
    setPreview(null);
    try {
      const backup = JSON.parse(value);
      if (backup?.version === 1 && backup.tables && typeof backup.tables === 'object') {
        const tableCounts = Object.entries(backup.tables).map(([table, rows]) => ({
          table,
          count: Array.isArray(rows) ? rows.length : 0,
        }));
        setPreview({
          createdAt: backup.createdAt,
          totalRows: tableCounts.reduce((sum, t) => sum + t.count, 0),
          tables: tableCounts,
        });
      }
    } catch {
      // invalid JSON, no preview
    }
  };

  const applyPasteBackup = async () => {
    if (!pasteJson.trim()) return showError('Paste a backup first.');
    let backup;
    try {
      backup = JSON.parse(pasteJson);
    } catch {
      return showError('The pasted content is not valid JSON.');
    }
    if (backup?.version !== 1 || !backup.tables || typeof backup.tables !== 'object') {
      return showError('This is not a valid LMS backup.');
    }
    if (!window.confirm('Restore this backup? Current LMS records will be replaced with the backup data.')) return;

    setIsWorking(true);
    const restoredTables = [];
    const failedTables = [];
    try {
      for (const table of backupTables) {
        const rows = backup.tables[table];
        if (!Array.isArray(rows)) continue;
        try {
          const { error: deleteError } = await supabase.from(table).delete().neq('id', 0);
          if (deleteError) throw deleteError;
          if (rows.length) {
            const cleanRows = rows.map(({ id: _id, ...row }) => row);
            const { error: insertError } = await supabase.from(table).insert(cleanRows);
            if (insertError) throw insertError;
          }
          restoredTables.push(table);
        } catch (err) {
          failedTables.push({ table, error: err.message });
        }
      }
      if (failedTables.length) {
        showError(`Restored ${restoredTables.length}/${backupTables.length} tables. Failed: ${failedTables.map(f => f.table).join(', ')}`);
      } else {
        showSuccess('Backup restored successfully. Reload the page to see all restored data.');
      }
      setPasteJson('');
      setPreview(null);
    } catch (error) {
      showError(error.message || 'Unable to restore the backup.');
    } finally {
      setIsWorking(false);
    }
  };

  const restoreFile = async () => {
    if (!backupFile) return showError('Choose a backup file first.');
    const text = await backupFile.text();
    setPasteJson(text);
    handlePasteChange(text);
    setBackupFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showSuccess('Backup loaded. Review the preview below, then click Restore.');
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header"><h3 className="text-lg font-semibold">Automatic Backup</h3></div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            A scheduled job runs every day at <strong>12:00 AM</strong>. It collects all LMS data and emails the backup file
            (as JSON attachment) to the admin email(s). Requires a Vercel Cron enabled project.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email (backup recipient)</label>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="input-field" placeholder="admin@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Notification Schedule</label>
              <select value={schedule} onChange={e => setSchedule(e.target.value)} className="input-field">
                <option value="daily">Daily (12:00 AM)</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={sendBackupEmail} disabled={isSending} className="flex items-center gap-2 btn-primary disabled:opacity-60">
              {isSending ? <Loader className="w-4 h-4 animate-spin" /> : <MailCheck className="w-4 h-4" />}
              {isSending ? 'Sending...' : 'Run Backup & Send Email Now'}
            </button>
            <button onClick={saveSchedule} className="flex items-center gap-2 btn-secondary"><Save className="w-4 h-4" />Save</button>
            <span className="text-sm text-gray-400">Last backup: {lastBackup}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="text-lg font-semibold">Manual Download</h3></div>
        <div className="p-6 flex flex-wrap items-center gap-3">
          <button onClick={createBackup} disabled={isWorking} className="flex items-center gap-2 btn-primary disabled:opacity-60"><Download className="w-4 h-4" />{isWorking ? 'Creating Backup...' : 'Download Backup File'}</button>
          <p className="text-sm text-gray-500 w-full">Downloads a full backup JSON file to your computer. You can later paste it below to restore.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="text-lg font-semibold">Restore Data</h3></div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Paste the backup JSON below (or choose a backup file) to see all its data, then restore. User accounts and passwords are not included.</p>

          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={e => setBackupFile(e.target.files?.[0] || null)} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 btn-secondary"><Upload className="w-4 h-4" />Choose Backup File</button>
            <button onClick={restoreFile} disabled={!backupFile} className="flex items-center gap-2 btn-secondary disabled:opacity-50"><ClipboardPaste className="w-4 h-4" />Load File into Preview</button>
            {backupFile && <span className="text-sm text-gray-500">Selected: {backupFile.name}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paste Backup JSON</label>
            <textarea
              value={pasteJson}
              onChange={e => handlePasteChange(e.target.value)}
              rows={6}
              placeholder='{"version":1,"createdAt":"...","tables":{...}}'
              className="input-field w-full font-mono text-xs"
            />
          </div>

          {preview && (
            <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                <Eye className="w-4 h-4" />
                Backup Preview
                <span className="text-xs font-normal text-indigo-500">{preview.createdAt ? new Date(preview.createdAt).toLocaleString() : 'date unknown'}</span>
              </div>
              <p className="text-sm text-indigo-700">Total records: <strong>{preview.totalRows}</strong></p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                {preview.tables.map(({ table, count }) => (
                  <div key={table} className="flex items-center justify-between bg-white rounded px-3 py-1.5 text-sm">
                    <span className="text-gray-700">{table}</span>
                    <span className="font-medium text-indigo-700">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={applyPasteBackup} disabled={!pasteJson.trim() || isWorking} className="btn-primary disabled:opacity-60">
              {isWorking ? 'Restoring...' : 'Restore Pasted Backup'}
            </button>
            {preview && <p className="text-sm text-gray-500">Review the preview, then restore will replace current data.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const location = useLocation();
  const tabIndexByPath = {
    '/admin/settings/smtp': 0,
    '/admin/settings/backup': 1,
  };
  const tabForRoute = tabIndexByPath[location.pathname] ?? 0;
  const [activeTab, setActiveTab] = useState(tabForRoute);

  useEffect(() => setActiveTab(tabForRoute), [tabForRoute]);

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

      {activeTab === 0 && <SMTPTab />}
      {activeTab === 1 && <BackupTab />}
    </div>
  );
}
