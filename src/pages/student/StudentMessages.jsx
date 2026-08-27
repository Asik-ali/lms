import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { showSuccess } from '../../components/common/Toast';

const mockMessages = [
  { id: 1, from: 'Admin', subject: 'Welcome to the LMS', body: 'Welcome to the Learning Management System. We are excited to have you!', time: '2 hours ago', read: false },
  { id: 2, from: 'System', subject: 'Course Enrollment Confirmed', body: 'Your enrollment has been confirmed. You can now access your course materials.', time: '1 day ago', read: true },
];

export default function StudentMessages() {
  const { user } = useAuth();
  const [messages] = useState(mockMessages);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    showSuccess('Reply sent!');
    setReplyText('');
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {messages.map(m => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className={`w-full text-left card p-4 transition-all cursor-pointer ${
                selected?.id === m.id ? 'border-indigo-300 ring-1 ring-indigo-200' : 'hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!m.read ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${!m.read ? 'text-gray-900' : 'text-gray-600'}`}>{m.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">From: {m.from}</p>
                  <p className="text-xs text-gray-400">{m.time}</p>
                </div>
              </div>
            </button>
          ))}
          {messages.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No messages yet</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="card p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selected.subject}</h2>
                <p className="text-sm text-gray-400 mt-1">From: {selected.from} &middot; {selected.time}</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{selected.body}</p>
              <div className="border-t border-gray-200 pt-4">
                <label className="label">Reply</label>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Type your reply..."
                />
                <button onClick={handleSendReply} className="btn-primary mt-3 flex items-center gap-2">
                  <Send className="w-4 h-4" /> Send Reply
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Select a message to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
