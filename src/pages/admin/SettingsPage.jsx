import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Database, Save, Download, Upload, Loader, MailCheck, ClipboardPaste, Eye } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { getSmtpSettings, saveSmtpSettings } from '../../data/dynamicStore';
import { apiUrl } from '../../data/api';
import { showError, showSuccess } from '../../components/common/Toast';
import { validateBackup } from '../../data/backup';

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
      const res = await fetch(apiUrl('/api/send-email'), {
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
    return <div className="card p-8 text-center text-navy-200"><Loader className="w-5 h-5 mx-auto mb-2 animate-spin" />Loading...</div>;
  }

  return (
    <div className="card animate-grow-in">
      <div className="card-header"><h3 className="text-lg font-semibold">SMTP Configuration</h3></div>
      <div className="p-6 space-y-4 max-w-xl">
        <div className="rounded-lg border border-navy-700 bg-navy-900/40 p-4 text-sm text-navy-200 space-y-2">
          <p>For Gmail, use <strong>smtp.gmail.com</strong> and port <strong>587</strong>. Enter the sending Gmail address as the username. If Google requires an app password, create one after enabling 2-Step Verification in that Google account, then enter it below.</p>
          <p>After saving, click <strong>Test Connection</strong> to send a test email to that address.</p>
          <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noreferrer" className="inline-block text-gold-400 underline">Google: create or manage an App Password</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <label className="block text-sm font-medium text-navy-100 mb-1">App Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your Gmail App Password" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-100 mb-1">Sender Name</label>
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


function BackupTab() {
  const [lastBackup, setLastBackup] = useState('No backup created yet');
  const [backupHistory, setBackupHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
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

  async function loadBackupHistory() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(apiUrl('/api/backup?operation=history'), {
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load backup history.');
      setBackupHistory(data.backups || []);
      setHistoryError('');
      const lastSuccessful = data.backups?.find(run => run.status === 'success');
      if (lastSuccessful?.created_at) setLastBackup(new Date(lastSuccessful.created_at).toLocaleString());
    } catch (error) {
      setHistoryError(error.message || 'Unable to load backup history.');
    }
  }

  useEffect(() => { loadBackupHistory(); }, []);

  const createBackup = async () => {
    setIsWorking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(apiUrl('/api/backup?operation=download'), {
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      });
      const backup = await response.json();
      if (!response.ok) throw new Error(backup.error || 'Unable to download backup.');
      validateBackup(backup);
      const createdAt = backup.createdAt;
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `lms-backup-${createdAt.slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      const label = new Date().toLocaleString();
      try { localStorage.setItem('lastBackup', label); } catch { /* Download remains valid without browser storage. */ }
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
      const res = await fetch(apiUrl('/api/backup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipient: adminEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        const label = new Date().toLocaleString();
        try { localStorage.setItem('lastBackup', label); } catch { /* Download remains valid without browser storage. */ }
        setLastBackup(label);
        if (data.complete === false) {
          const results = [
            data.googleSheets?.success ? 'Google Sheets saved' : `Google Sheets failed: ${data.googleSheets?.error || 'not configured'}`,
            data.emailSent ? `email sent to ${adminEmail}` : `email failed: ${data.emailError || 'unknown error'}`,
          ];
          showError(`Backup finished with issues. ${results.join('; ')}.`);
        } else showSuccess(`Backup emailed to ${adminEmail}${data.googleSheets?.success ? ' and saved to Google Sheets' : ''}.`);
        await loadBackupHistory();
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
      {
        const tableCounts = validateBackup(backup);
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
    try { validateBackup(backup); }
    catch (error) { return showError(error.message); }
    if (!window.confirm('Restore matching records from this backup? Original IDs will be preserved. Records absent from the backup will be kept. User accounts must already exist.')) return;
    setIsWorking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(apiUrl('/api/backup?operation=restore'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ backup }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to restore backup.');
      showSuccess('Backup restored successfully. Existing records outside the backup were kept.');
      setPasteJson('');
      setPreview(null);
    } catch (error) { showError(error.message || 'Unable to restore the backup.'); }
    finally { setIsWorking(false); }
  };

  const restoreFile = async () => {
    if (!backupFile) return showError('Choose a backup file first.');
    try {
      const text = await backupFile.text();
      validateBackup(JSON.parse(text));
      handlePasteChange(text);
      setBackupFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showSuccess('Backup loaded. Review the preview below, then click Restore.');
    } catch (error) { showError(error.message || 'Unable to read the backup file.'); }

  };

  return (
    <div className="space-y-6 animate-stagger">
      <div className="card">
        <div className="card-header"><h3 className="text-lg font-semibold">Automatic Backup</h3></div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-navy-100">
            Vercel runs the automatic backup every day at <strong>5:30 AM India time</strong>. It emails the backup JSON to the admin email addresses. Check the history below to confirm whether each backup succeeded.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-navy-100 mb-1">Email for manual backup</label>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="input-field" placeholder="admin@example.com" />
            </div>
            <p className="self-end text-xs text-navy-300">Automatic backups email every admin account. This address is used only when you run a backup manually.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={sendBackupEmail} disabled={isSending} className="flex items-center gap-2 btn-primary disabled:opacity-60">
              {isSending ? <Loader className="w-4 h-4 animate-spin" /> : <MailCheck className="w-4 h-4" />}
              {isSending ? 'Sending...' : 'Run Backup & Send Email Now'}
            </button>
            <span className="text-sm text-navy-300">Last backup: {lastBackup}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Backup History</h3><button onClick={loadBackupHistory} className="btn-secondary text-sm">Refresh</button></div>
        <div className="p-6 space-y-3">
          {historyError && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{historyError}</p>}
          {!backupHistory.length && !historyError && <p className="text-sm text-navy-300">No backup runs have been recorded yet. Check that Vercel has CRON_SECRET, SMTP is configured, and this version is deployed to production.</p>}
          {backupHistory.map(run => {
            const counts = run.record_counts || {};
            const failedTables = Object.entries(counts).filter(([, count]) => Number(count) < 0);
            return <div key={run.id} className="rounded-lg border border-navy-700 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium text-navy-100">{run.type === 'cron' ? 'Automatic' : 'Manual'} backup</span><span className={run.status === 'success' ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}>{run.status === 'success' ? 'Succeeded' : 'Failed'}</span></div>
              <p className="mt-1 text-navy-300">{new Date(run.created_at).toLocaleString()}</p>
              <p className="mt-1 text-navy-200">{Object.keys(counts).length} tables recorded | emailed to {(run.emailed_to || []).join(', ') || 'nobody'}</p>
              {failedTables.length > 0 && <p className="mt-1 text-amber-600 dark:text-amber-300">Tables with export errors: {failedTables.map(([table]) => table).join(', ')}</p>}
              {run.error && <p className="mt-1 text-red-600 dark:text-red-300">{run.error}</p>}
            </div>;
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="text-lg font-semibold">Manual Download</h3></div>
        <div className="p-6 flex flex-wrap items-center gap-3">
          <button onClick={createBackup} disabled={isWorking} className="flex items-center gap-2 btn-primary disabled:opacity-60"><Download className="w-4 h-4" />{isWorking ? 'Creating Backup...' : 'Download Backup File'}</button>
          <p className="text-sm text-navy-200 w-full">Downloads a full backup JSON file to your computer. You can later paste it below to restore.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="text-lg font-semibold">Restore Data</h3></div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-navy-100">Paste the backup JSON below (or choose a backup file) to see all its data, then restore. Authentication passwords and stored files are not included. User accounts must already exist; only their profile data can be restored. Audit logs and temporary sessions are export-only.</p>

          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={e => setBackupFile(e.target.files?.[0] || null)} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 btn-secondary"><Upload className="w-4 h-4" />Choose Backup File</button>
            <button onClick={restoreFile} disabled={!backupFile} className="flex items-center gap-2 btn-secondary disabled:opacity-50"><ClipboardPaste className="w-4 h-4" />Load File into Preview</button>
            {backupFile && <span className="text-sm text-navy-200">Selected: {backupFile.name}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-100 mb-1">Paste Backup JSON</label>
            <textarea
              value={pasteJson}
              onChange={e => handlePasteChange(e.target.value)}
              rows={6}
              placeholder='{"version":1,"createdAt":"...","tables":{...}}'
              className="input-field w-full font-mono text-xs"
            />
          </div>

          {preview && (
            <div className="border border-navy-200 bg-navy-50 dark:bg-navy-500/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-navy-500 dark:text-navy-100 font-semibold">
                <Eye className="w-4 h-4" />
                Backup Preview
                <span className="text-xs font-normal text-navy-500">{preview.createdAt ? new Date(preview.createdAt).toLocaleString() : 'date unknown'}</span>
              </div>
              <p className="text-sm text-navy-500 dark:text-navy-100">Total records: <strong>{preview.totalRows}</strong></p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                {preview.tables.map(({ table, count }) => (
                  <div key={table} className="flex items-center justify-between bg-surface rounded px-3 py-1.5 text-sm">
                    <span className="text-navy-100">{table}</span>
                    <span className="font-medium text-navy-500 dark:text-navy-100">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={applyPasteBackup} disabled={!preview || isWorking} className="btn-primary disabled:opacity-60">
              {isWorking ? 'Restoring...' : 'Restore Pasted Backup'}
            </button>
            {preview && <p className="text-sm text-navy-200">Review the preview, then restore updates matching IDs and keeps other records.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabsByPath = {
    '/admin/settings/smtp': 0,
    '/admin/settings/backup': 1,
  };
  const activeTab = tabsByPath[location.pathname] ?? 0;
  const tabsByIndex = [
    { label: 'SMTP', icon: Mail, path: '/admin/settings/smtp' },
    { label: 'Backup & Restore', icon: Database, path: '/admin/settings/backup' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-100">Settings</h1>
      </div>

      <div className="border-b border-navy-700 animate-fade-up">
        <div className="flex gap-0 -mb-px overflow-x-auto">
          {tabsByIndex.map((tab, i) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  i === activeTab
                    ? 'border-navy-600 text-navy-600'
                    : 'border-transparent text-navy-200 hover:text-navy-100 hover:border-navy-500'
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
