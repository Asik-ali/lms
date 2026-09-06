import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Bell, Send, Loader } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { showError, showSuccess } from '../../components/common/Toast';
import { apiUrl } from '../../data/api';

const tabs = [
  { label: 'Email', icon: Mail, path: '/admin/notifications/email' },
  { label: 'Push Notifications', icon: Bell, path: '/admin/notifications/push' },
];

const recipientOptions = [
  { value: 'all_students', label: 'All Students' },
  { value: 'all_users', label: 'All Users' },
];

function ComposeForm({ type }) {
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
      let emails = [];

      if (recipient === 'all_students') {
        const { data } = await supabase.from('profiles').select('email').eq('role', 'student');
        emails = data?.map(p => p.email).filter(Boolean) || [];
      } else {
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

        } else if (type === 'Push Notifications') {
        const res = await fetch(apiUrl('/api/send-push'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ recipient, subject, message }),
        });

        const data = await res.json();

        if (res.ok) {
          let info = `sent to ${data.sent || 0} of ${data.total || 0} device(s).`;
          if (!data.webConfigured) info += ' Web push not configured (VAPID keys missing).';
          if (!data.fcmConfigured) info += ` FCM not configured (${data.fcmInitError || 'service account missing'}).`;
          showSuccess(info);
        } else {
          showError(data.error || 'Failed to send push notifications.');
        }
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
    <div className="card animate-grow-in">
      <div className="card-header"><h3 className="text-lg font-semibold">Compose {type}</h3></div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy-100 mb-1">Recipient</label>
          <select value={recipient} onChange={e => setRecipient(e.target.value)} className="input-field">
            {recipientOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-100 mb-1">Subject</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder={ph.subject} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-100 mb-1">Message</label>
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
  const location = useLocation();
  const navigate = useNavigate();
  const tabsByPath = {
    '/admin/notifications/email': 0,
    '/admin/notifications/push': 1,
  };
  const activeTab = tabsByPath[location.pathname] ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <h1 className="text-2xl font-bold text-navy-100">Notifications</h1>
      </div>

      <div className="border-b border-navy-700 animate-fade-up">
        <div className="flex gap-0 -mb-px">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
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

      <ComposeForm type={tabs[activeTab].label} />
    </div>
  );
}
