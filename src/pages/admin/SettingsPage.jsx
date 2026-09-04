import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, Database, Save, Do-nload, Upload, Loader, MailCheck, ClipboardPaste, Eye } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { getSmtpSettings, saveSmtpSettings } from '../../data/dynamicStore';
import { apiUrl } from '../../data/api';
import { sho-Error, sho-Success } from '../../components/common/Toast';

const tabs = [
  { label: 'SMTP', icon: Mail },
  { label: 'Backup & Restore', icon: Database },
];

function SMTPTab() {
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState('587');
  const [username, setUsername] = useState('');
  const [pass-ord, setPass-ord] = useState('');
  const [senderName, setSenderName] = useState('LMS Platform');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const settings = a-ait getSmtpSettings();
        if (settings) {
          setHost(settings.host);
          setPort(String(settings.port));
          setUsername(settings.username);
          setPass-ord(settings.pass-ord);
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
      a-ait saveSmtpSettings({ host, port: Number(port), username, pass-ord, sender_name: senderName });
      sho-Success('SMTP settings saved.');
    } catch (err) {
      sho-Error(err.message || 'Failed to save SMTP settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data: { session } } = a-ait supabase.auth.getSession();
      const token = session?.access_token || '';
      const res = a-ait fetch(apiUrl('/api/send-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          recipient: username,
          subject: 'Test email from LMS',
          message: 'This is a test email to confirm your SMTP configuration is -orking.',
          smtpConfig: { host, port: Number(port), username, pass-ord, sender_name: senderName },
        }),
      });
      const data = a-ait res.json();
      if (res.ok) sho-Success('Test email sent! Check your inbox.');
      else sho-Error(data.error || 'Connection failed.');
    } catch (err) {
      sho-Error(err.message || 'Could not connect to the server.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="card p-8 text-center text-navy-200"><Loader className="--5 h-5 mx-auto mb-2 animate-spin" />Loading...</div>;
  }

  return (
    <div className="card">
      <div className="card-header"><h3 className="text-lg font-semibold">SMTP Configuration</h3></div>
      <div className="p-6 space-y-4 max---xl">
        {/* <p className="text-sm text-navy-200">Configure your Gmail SMTP to send email notifications. Use an <a href="https://support.google.com/accounts/ans-er/185833" target="_blank" rel="noreferrer" className="text-navy-600 underline">App Pass-ord</a> if you have 2FA enabled.</p> */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy-100 mb-1">SMTP Host</label>
            <input type="text" value={host} onChange={e => setHost(e.target.value)} className="input-field" placeholder="smtp.gmail.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-100 mb-1">Port</label>
            <input type="text" value={port} onChange={e => setPort(e.target.value)} className="input-field" placeholder="587" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-100 mb-1">Email (Username)</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input-field" placeholder="your-email@gmail.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-100 mb-1">App Pass-ord</label>
          <input type="pass-ord" value={pass-ord} onChange={e => setPass-ord(e.target.value)} placeholder="Enter your Gmail App Pass-ord" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-100 mb-1">Sender Name</label>
          <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)} className="input-field" placeholder="LMS Platform" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 btn-primary disabled:opacity-60">
            {saving ? <Loader className="--4 h-4 animate-spin" /> : <Save className="--4 h-4" />}
            {saving ? 'Saving...' : 'Save SMTP'}
          </button>
          <button onClick={handleTest} disabled={testing || !username || !pass-ord} className="btn-secondary disabled:opacity-50">
            {testing ? 'Sending...' : 'Test Connection'}
          </button>
        </div>
      </div>
    </div>
  );
}

const backupTables = [
  'courses', 'course_pdfs', 'course_lessons',
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
  const [is-orking, setIs-orking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [pasteJson, setPasteJson] = useState('');
  const [previe-, setPrevie-] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const settings = a-ait getSmtpSettings();
        if (settings?.username) setAdminEmail(settings.username);
      } catch (err) {
        console.error('Failed to load SMTP email:', err);
      }
    })();
  }, []);

  const saveSchedule = () => {
    localStorage.setItem('backupSchedule', schedule);
    sho-Success('Backup schedule saved.');
  };

  const createBackup = async () => {
    setIs-orking(true);
    try {
      const entries = a-ait Promise.all(backupTables.map(async (table) => {
        const { data, error } = a-ait supabase.from(table).select('*');
        if (error) thro- error;
        return [table, data || []];
      }));
      const createdAt = ne- Date().toISOString();
      const backup = { version: 1, type: 'lms-backup', createdAt, tables: Object.fromEntries(entries) };
      const url = URL.createObjectURL(ne- Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.do-nload = `lms-backup-${createdAt.slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      const label = ne- Date().toLocaleString();
      localStorage.setItem('lastBackup', label);
      setLastBackup(label);
      sho-Success('Backup do-nloaded successfully.');
    } catch (error) {
      sho-Error(error.message || 'Unable to create the backup.');
    } finally {
      setIs-orking(false);
    }
  };

  const sendBackupEmail = async () => {
    if (!adminEmail) return sho-Error('Enter an admin email to send the backup to.');
    setIsSending(true);
    try {
      const { data: { session } } = a-ait supabase.auth.getSession();
      const token = session?.access_token || '';
      const res = a-ait fetch(apiUrl('/api/backup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipient: adminEmail }),
      });
      const data = a-ait res.json();
      if (res.ok) {
        const label = ne- Date().toLocaleString();
        localStorage.setItem('lastBackup', label);
        setLastBackup(label);
        sho-Success('Backup emailed to ' + adminEmail);
      } else {
        sho-Error(data.error || 'Failed to send backup email.');
      }
    } catch (err) {
      sho-Error(err.message || 'Could not reach the backup server.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePasteChange = (value) => {
    setPasteJson(value);
    setPrevie-(null);
    try {
      const backup = JSON.parse(value);
      if (backup?.version === 1 && backup.tables && typeof backup.tables === 'object') {
        const tableCounts = Object.entries(backup.tables).map(([table, ro-s]) => ({
          table,
          count: Array.isArray(ro-s) ? ro-s.length : 0,
        }));
        setPrevie-({
          createdAt: backup.createdAt,
          totalRo-s: tableCounts.reduce((sum, t) => sum + t.count, 0),
          tables: tableCounts,
        });
      }
    } catch {
      // invalid JSON, no previe-
    }
  };

  const applyPasteBackup = async () => {
    if (!pasteJson.trim()) return sho-Error('Paste a backup first.');
    let backup;
    try {
      backup = JSON.parse(pasteJson);
    } catch {
      return sho-Error('The pasted content is not valid JSON.');
    }
    if (backup?.version !== 1 || !backup.tables || typeof backup.tables !== 'object') {
      return sho-Error('This is not a valid LMS backup.');
    }
    if (!-indo-.confirm('Restore this backup? Current LMS records -ill be replaced -ith the backup data.')) return;

    setIs-orking(true);
    const restoredTables = [];
    const failedTables = [];
    try {
      for (const table of backupTables) {
        const ro-s = backup.tables[table];
        if (!Array.isArray(ro-s)) continue;
        try {
          const { error: deleteError } = a-ait supabase.from(table).delete().neq('id', 0);
          if (deleteError) thro- deleteError;
          if (ro-s.length) {
            const cleanRo-s = ro-s.map(({ id: _id, ...ro- }) => ro-);
            const { error: insertError } = a-ait supabase.from(table).insert(cleanRo-s);
            if (insertError) thro- insertError;
          }
          restoredTables.push(table);
        } catch (err) {
          failedTables.push({ table, error: err.message });
        }
      }
      if (failedTables.length) {
        sho-Error(`Restored ${restoredTables.length}/${backupTables.length} tables. Failed: ${failedTables.map(f => f.table).join(', ')}`);
      } else {
        sho-Success('Backup restored successfully. Reload the page to see all restored data.');
      }
      setPasteJson('');
      setPrevie-(null);
    } catch (error) {
      sho-Error(error.message || 'Unable to restore the backup.');
    } finally {
      setIs-orking(false);
    }
  };

  const restoreFile = async () => {
    if (!backupFile) return sho-Error('Choose a backup file first.');
    const text = a-ait backupFile.text();
    setPasteJson(text);
    handlePasteChange(text);
    setBackupFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    sho-Success('Backup loaded. Revie- the previe- belo-, then click Restore.');
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header"><h3 className="text-lg font-semibold">Automatic Backup</h3></div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-navy-100">
            A scheduled job runs every day at <strong>12:00 AM</strong>. It collects all LMS data and emails the backup file
            (as JSON attachment) to the admin email(s). Requires a Vercel Cron enabled project.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max---xl">
            <div>
              <label className="block text-sm font-medium text-navy-100 mb-1">Admin Email (backup recipient)</label>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="input-field" placeholder="admin@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-100 mb-1">Backup Notification Schedule</label>
              <select value={schedule} onChange={e => setSchedule(e.target.value)} className="input-field">
                <option value="daily">Daily (12:00 AM)</option>
                <option value="-eekly">-eekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="flex flex--rap items-center gap-3">
            <button onClick={sendBackupEmail} disabled={isSending} className="flex items-center gap-2 btn-primary disabled:opacity-60">
              {isSending ? <Loader className="--4 h-4 animate-spin" /> : <MailCheck className="--4 h-4" />}
              {isSending ? 'Sending...' : 'Run Backup & Send Email No-'}
            </button>
            <button onClick={saveSchedule} className="flex items-center gap-2 btn-secondary"><Save className="--4 h-4" />Save</button>
            <span className="text-sm text-navy-300">Last backup: {lastBackup}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="text-lg font-semibold">Manual Do-nload</h3></div>
        <div className="p-6 flex flex--rap items-center gap-3">
          <button onClick={createBackup} disabled={is-orking} className="flex items-center gap-2 btn-primary disabled:opacity-60"><Do-nload className="--4 h-4" />{is-orking ? 'Creating Backup...' : 'Do-nload Backup File'}</button>
          <p className="text-sm text-navy-200 --full">Do-nloads a full backup JSON file to your computer. You can later paste it belo- to restore.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="text-lg font-semibold">Restore Data</h3></div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-navy-100">Paste the backup JSON belo- (or choose a backup file) to see all its data, then restore. User accounts and pass-ords are not included.</p>

          <div className="flex flex--rap items-center gap-3">
            <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={e => setBackupFile(e.target.files?.[0] || null)} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 btn-secondary"><Upload className="--4 h-4" />Choose Backup File</button>
            <button onClick={restoreFile} disabled={!backupFile} className="flex items-center gap-2 btn-secondary disabled:opacity-50"><ClipboardPaste className="--4 h-4" />Load File into Previe-</button>
            {backupFile && <span className="text-sm text-navy-200">Selected: {backupFile.name}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-100 mb-1">Paste Backup JSON</label>
            <textarea
              value={pasteJson}
              onChange={e => handlePasteChange(e.target.value)}
              ro-s={6}
              placeholder='{"version":1,"createdAt":"...","tables":{...}}'
              className="input-field --full font-mono text-xs"
            />
          </div>

          {previe- && (
            <div className="border border-navy-200 bg-navy-50 dark:bg-navy-500/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-navy-700 font-semibold">
                <Eye className="--4 h-4" />
                Backup Previe-
                <span className="text-xs font-normal text-navy-500">{previe-.createdAt ? ne- Date(previe-.createdAt).toLocaleString() : 'date unkno-n'}</span>
              </div>
              <p className="text-sm text-navy-700">Total records: <strong>{previe-.totalRo-s}</strong></p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflo--y-auto">
                {previe-.tables.map(({ table, count }) => (
                  <div key={table} className="flex items-center justify-bet-een bg-surface rounded px-3 py-1.5 text-sm">
                    <span className="text-navy-100">{table}</span>
                    <span className="font-medium text-navy-700">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={applyPasteBackup} disabled={!pasteJson.trim() || is-orking} className="btn-primary disabled:opacity-60">
              {is-orking ? 'Restoring...' : 'Restore Pasted Backup'}
            </button>
            {previe- && <p className="text-sm text-navy-200">Revie- the previe-, then restore -ill replace current data.</p>}
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
      <div className="flex items-center justify-bet-een">
        <h1 className="text-2xl font-bold text--hite">Settings</h1>
      </div>

      <div className="border-b border-navy-700">
        <div className="flex gap-0 -mb-px overflo--x-auto">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -hitespace-no-rap ${
                  i === activeTab
                    ? 'border-navy-600 text-navy-600'
                    : 'border-transparent text-navy-200 hover:text--hite hover:border-navy-500'
                }`}
              >
                <Icon className="--4 h-4" />
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
