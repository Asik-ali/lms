import { useState, useEffect } from 'react';
import { MessageSquare, Send, Plus, ArrowLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getTickets, addTicket, getTicketReplies, addTicketReply } from '../../data/dynamicStore';
import { showSuccess, showError } from '../../components/common/Toast';

const statusConfig = {
  Open: { icon: AlertCircle, color: 'text-amber-600 bg-amber-100' },
  'In Progress': { icon: Clock, color: 'text-blue-600 bg-blue-100' },
  Resolved: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100' },
};

export default function StudentMessages() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadTickets(); }, [user?.id]);

  async function loadTickets() {
    if (!user?.id) return;
    const data = await getTickets(user.id);
    setTickets(data);
  }

  async function handleSelect(t) {
    setSelected(t);
    setShowNew(false);
    const r = await getTicketReplies(t.id);
    setReplies(r);
  }

  async function handleCreateTicket() {
    if (!newSubject.trim() || !newMessage.trim()) return showError('Fill in all fields');
    setLoading(true);
    try {
      await addTicket({ student_id: user.id, subject: newSubject.trim(), message: newMessage.trim() });
      setNewSubject('');
      setNewMessage('');
      setShowNew(false);
      showSuccess('Ticket created!');
      await loadTickets();
    } catch (e) {
      showError(e.message);
    }
    setLoading(false);
  }

  async function handleSendReply() {
    if (!replyText.trim() || !selected) return;
    setLoading(true);
    try {
      await addTicketReply({ ticket_id: selected.id, sender_id: user.id, message: replyText.trim() });
      setReplyText('');
      const r = await getTicketReplies(selected.id);
      setReplies(r);
      showSuccess('Reply sent!');
    } catch (e) {
      showError(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        {!showNew && !selected && (
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        )}
      </div>

      {showNew && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setShowNew(false)} className="p-1 hover:bg-gray-100 rounded cursor-pointer"><ArrowLeft className="w-4 h-4" /></button>
            <h2 className="text-lg font-semibold">New Support Ticket</h2>
          </div>
          <div>
            <label className="label">Subject</label>
            <input value={newSubject} onChange={e => setNewSubject(e.target.value)} className="input-field" placeholder="Brief description of your issue" />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} className="input-field" rows={4} placeholder="Describe your issue in detail..." />
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreateTicket} disabled={loading} className="btn-primary flex items-center gap-2">
              <Send className="w-4 h-4" /> {loading ? 'Sending...' : 'Submit Ticket'}
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      {!showNew && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {tickets.map(t => {
              const cfg = statusConfig[t.status] || statusConfig.Open;
              const Icon = cfg.icon;
              return (
                <button key={t.id} onClick={() => handleSelect(t)} className={`w-full text-left card p-4 transition-all cursor-pointer ${selected?.id === t.id ? 'border-indigo-300 ring-1 ring-indigo-200' : 'hover:border-gray-300'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.status} &middot; {new Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </button>
              );
            })}
            {tickets.length === 0 && !showNew && (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No tickets yet</p>
                <button onClick={() => setShowNew(true)} className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 cursor-pointer">Create your first ticket</button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <div className="card p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selected.subject}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[selected.status]?.color || ''}`}>{selected.status}</span>
                    <span className="text-xs text-gray-400">Created {new Date(selected.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">You</p>
                    <p className="text-sm text-gray-700">{selected.message}</p>
                  </div>
                  {replies.map(r => (
                    <div key={r.id} className={`rounded-lg p-3 ${r.sender_id === user.id ? 'bg-indigo-50 ml-8' : 'bg-gray-100 mr-8'}`}>
                      <p className="text-xs text-gray-400 mb-1">{r.sender_id === user.id ? 'You' : 'Admin'}</p>
                      <p className="text-sm text-gray-700">{r.message}</p>
                    </div>
                  ))}
                </div>

                {selected.status !== 'Resolved' && (
                  <div className="border-t border-gray-200 pt-4">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="input-field"
                      rows={3}
                      placeholder="Type your reply..."
                    />
                    <button onClick={handleSendReply} disabled={loading || !replyText.trim()} className="btn-primary mt-3 flex items-center gap-2 cursor-pointer">
                      <Send className="w-4 h-4" /> {loading ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !showNew && (
                <div className="card p-8 text-center text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a ticket to view details</p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
