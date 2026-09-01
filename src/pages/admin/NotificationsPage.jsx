import { useState } from 'react';
import { Mail, Bell, Send, Loader } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { showError, showSuccess } from '../../components/common/Toast';
import { apiUrl } from '../../data/api';

const tabs = [
  { label: 'Email', icon: Mail },
  { label: 'Push Notifications', icon: Bell },
];

const recipientOptions = [
  { value: 'all_students', label: 'All Students' },
  { value: 'all_users', label: 'All Users' },
];

function ComposeForm({ type, onSent }) {
  const [recipient, setRecipient] = useState('all_students');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const placeholders = {
    Email: { subject: 'Notification subject', message: 'Write your email message...' },
    'Push Notifications': { subject: 'Push title', message: 'Write your push message...' },
  };

  const ph = placeholders[type] || placeholders.Email;

  const handleSend = async () => {
    if (!subject || !message) return showError('Subject and message are required.');

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      let recipientLabel = '';
      let emails = [];

      if (recipient === 'all_students') {
        recipientLabel = 'All Students';
        const { data } = await supabase.from('profiles').select('email').eq('role', 'student');
        emails = data?.map(p => p.email).filter(Boolean) || [];
      } else {
        recipientLabel = 'All Users';
        const { data } = await supabase.from('profiles').select('email');
        emails = data?.map(p => p.email).filter(Boolean) || [];
      }

      if (type === 'Email') {
        if (emails.length === 0) {
          showError('No recipients found.');
          setSending(false);
          return;
        }

        const results = await Promise.allSettled(
          emails.map(email =>
            fetch(apiUrl('/api/send-email'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ recipient: email, subject, message }),
            }).then(async r => ({ ok: r.ok, body: await r.json() }))
          )
        );

        const sentCount = results.filter(r => r.status === 'fulfilled' && r.value?.ok).length;
        const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.ok));
        const firstError = failed[0]?.value?.body?.error || 'Check SMTP settings.';

        if (failed.length === 0) {
          showSuccess(`Email sent to ${sentCount} recipient(s).`);
        } else {
          showError(`Sent to ${sentCount}, failed for ${failed.length}. ${firstError}`);
        }

        onSent({ type, recipient: recipientLabel, subject, status: failed.length === 0 ? 'Sent' : 'Failed' });
      } else if (type === 'Push Notifications') {
        const res = await fetch(apiUrl('/api/send-push'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ recipient, subject, message }),
        });

        const data = await res.json();

        if (res.ok) {
          showSuccess(`Push notification sent to ${data.sent || 0} device(s).`);
        } else {
          showError(data.error || 'Failed to send push notifications.');
        }

        onSent({ type, recipient: recipientLabel, subject, status: res.ok ? 'Sent' : 'Failed' });
      }

      setSubject('');
      setMessage('');
    } catch (err) {
      showError(err.message || 'Failed to send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header"><h3 className="text-lg font-semibold">Compose {type}</h3></div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient</label>
          <select value={recipient} onChange={e => setRecipient(e.target.value)} className="input-field">
            {recipientOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder={ph.subject} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
          <textarea rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder={ph.message} className="input-field resize-none" />
        </div>
        <button onClick={handleSend} disabled={sending} className="flex items-center gap-2 btn-primary disabled:opacity-60">
          {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending...' : `Send ${type}`}
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState([]);

  const addToHistory = (entry) => {
    setHistory(prev => [{ id: Date.now(), sent: new Date().toISOString().slice(0, 10), ...entry }, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-0 -mb-px">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  i === activeTab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <ComposeForm type={tabs[activeTab].label} onSent={addToHistory} />

      <div className="card overflow-hidden">
        <div className="card-header"><h3 className="text-lg font-semibold">Sent History</h3></div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
              <th className="table-header">Type</th>
              <th className="table-header">Recipient</th>
              <th className="table-header">Subject</th>
              <th className="table-header">Date</th>
              <th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400 dark:text-gray-500">No notifications sent yet.</td></tr>
            )}
            {history.map(h => (
              <tr key={h.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="table-cell font-medium">{h.type}</td>
                <td className="table-cell">{h.recipient}</td>
                <td className="table-cell text-gray-600 dark:text-gray-400">{h.subject}</td>
                <td className="table-cell text-gray-500 dark:text-gray-400">{h.sent}</td>
                <td className="table-cell">
                  <span className={`badge ${h.status === 'Sent' ? 'badge-success' : 'badge-danger'}`}>{h.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
