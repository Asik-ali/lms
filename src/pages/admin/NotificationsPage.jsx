import { useState } from 'react';
import { Mail, MessageSquare, Bell, Send } from 'lucide-react';
import { students, instructors } from '../../data/mockData';

const tabs = [
  { label: 'Email', icon: Mail },
  { label: 'SMS', icon: MessageSquare },
  { label: 'Push Notifications', icon: Bell },
];

const sentHistory = [
  { id: 1, type: 'Email', recipient: 'All Students', subject: 'Holiday Notice - August 15', sent: '2026-07-28', status: 'Sent' },
  { id: 2, type: 'Email', recipient: 'All Instructors', subject: 'Faculty Meeting', sent: '2026-07-25', status: 'Sent' },
  { id: 3, type: 'SMS', recipient: 'All Students', subject: 'Class Reminder', sent: '2026-07-22', status: 'Sent' },
  { id: 4, type: 'Push', recipient: 'Specific', subject: 'New Course Alert', sent: '2026-07-20', status: 'Failed' },
];

const recipients = [
  { value: 'all_students', label: 'All Students' },
  { value: 'all_instructors', label: 'All Instructors' },
  { value: 'all_users', label: 'All Users' },
  { value: 'specific', label: 'Specific Users' },
];

function ComposeForm({ type }) {
  const [recipient, setRecipient] = useState('all_students');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const placeholders = {
    Email: { subject: 'Notification subject', message: 'Write your email message...' },
    SMS: { subject: 'SMS subject', message: 'Write your SMS message...' },
    'Push Notifications': { subject: 'Push title', message: 'Write your push message...' },
  };

  const ph = placeholders[type] || placeholders.Email;

  return (
    <div className="card">
      <div className="card-header"><h3 className="text-lg font-semibold">Compose {type}</h3></div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
          <select value={recipient} onChange={e => setRecipient(e.target.value)} className="input-field">
            {recipients.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder={ph.subject} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder={ph.message} className="input-field resize-none" />
        </div>
        <button className="flex items-center gap-2 btn-primary">
          <Send className="w-4 h-4" />
          Send {type}
        </button>
      </div>
    </div>
  );
}

function HistoryTable() {
  return (
    <div className="card overflow-hidden">
      <div className="card-header"><h3 className="text-lg font-semibold">Sent History</h3></div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="table-header">Type</th>
            <th className="table-header">Recipient</th>
            <th className="table-header">Subject</th>
            <th className="table-header">Date</th>
            <th className="table-header">Status</th>
          </tr>
        </thead>
        <tbody>
          {sentHistory.map(h => (
            <tr key={h.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="table-cell font-medium">{h.type}</td>
              <td className="table-cell">{h.recipient}</td>
              <td className="table-cell text-gray-600">{h.subject}</td>
              <td className="table-cell text-gray-500">{h.sent}</td>
              <td className="table-cell">
                <span className={`badge ${h.status === 'Sent' ? 'badge-success' : 'badge-danger'}`}>{h.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      </div>

      <div className="border-b border-gray-200">
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

      <ComposeForm type={tabs[activeTab].label} />
      <HistoryTable />
    </div>
  );
}
