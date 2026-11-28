import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Send, Plus, ArrowLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getTickets, addTicket, addTicketReply } from '../../data/dynamicStore';
import { showSuccess, showError } from '../../components/common/Toast';
import useTicketReplies from '../../components/common/useTicketReplies';

const statusConfig = {
  Open: { icon: AlertCircle, color: 'text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15' },
  'In Progress': { icon: Clock, color: 'text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/15' },
  Resolved: { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15' },
};

export default function StudentMessages() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const { replies, loading: repliesLoading, error: repliesError, refresh: refreshReplies } = useTicketReplies(selected?.id);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState('');
  const listRequest = useRef(0);
  const [replyText, setReplyText] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!user?.id) return;
    const request = ++listRequest.current;
    setTicketsLoading(true);
    setTicketsError('');
    try {
      const data = await getTickets(user.id);
      if (request === listRequest.current) setTickets(data);
    } catch (err) {
      if (request === listRequest.current) setTicketsError('Unable to load tickets. Please retry.');
    } finally {
      if (request === listRequest.current) setTicketsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadTickets(); return () => { listRequest.current++; }; }, [loadTickets]);

  function handleSelect(t) {
    if (loading) return;
    setSelected(t);
    setReplyText('');
    setShowNew(false);
  }

  async function handleCreateTicket() {
    if (loading) return;
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
    if (loading || repliesLoading || repliesError || !replyText.trim() || !selected) return;
    setLoading(true);
    try {
      await addTicketReply({ ticket_id: selected.id, sender_id: user.id, message: replyText.trim() });
      setReplyText('');
      refreshReplies();
      showSuccess('Reply sent!');
    } catch (e) {
      showError(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {ticketsError && <div role="alert" className="card p-4 text-navy-200"><p>{ticketsError}</p><button className="btn-secondary mt-3" onClick={loadTickets}>Retry tickets</button></div>}
      {ticketsLoading && <p role="status" className="text-sm text-navy-300">Loading tickets...</p>}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-100">Support Tickets</h1>
        {!showNew && !selected && (
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        )}
      </div>

      {showNew && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setShowNew(false)} className="p-1 hover:bg-navy-700 rounded cursor-pointer"><ArrowLeft className="w-4 h-4" /></button>
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
            <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-lg border border-navy-700 text-navy-100 hover:bg-navy-700/60 cursor-pointer">Cancel</button>
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
                <button key={t.id} disabled={loading} onClick={() => handleSelect(t)} className={`w-full text-left card p-4 transition-all cursor-pointer ${selected?.id === t.id ? 'border-navy-300 ring-1 ring-navy-200' : 'hover:border-navy-500'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-navy-100 truncate">{t.subject}</p>
                      <p className="text-xs text-navy-300 mt-0.5">{t.status} &middot; {new Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </button>
              );
            })}
            {!ticketsLoading && !ticketsError && tickets.length === 0 && !showNew && (
              <div className="text-center py-8 text-navy-300">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-navy-300" />
                <p>No tickets yet</p>
                <button onClick={() => setShowNew(true)} className="text-sm text-navy-600 hover:text-navy-500 dark:hover:text-navy-400 mt-2 cursor-pointer">Create your first ticket</button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <div className="card p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-navy-100">{selected.subject}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[selected.status]?.color || ''}`}>{selected.status}</span>
                    <span className="text-xs text-navy-300">Created {new Date(selected.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <div className="bg-navy-800/60 rounded-lg p-3">
                    <p className="text-xs text-navy-300 mb-1">You</p>
                    <p className="text-sm text-navy-100">{selected.message}</p>
                  </div>
                  {repliesLoading && <p role="status" className="text-sm text-navy-300">Loading replies...</p>}
                {repliesError && <div role="alert" className="rounded-lg border border-navy-700 p-3 text-sm text-navy-200"><p>{repliesError}</p><button className="btn-secondary mt-2" onClick={refreshReplies}>Retry replies</button></div>}
                {replies.map(r => (
                    <div key={r.id} className={`rounded-lg p-3 ${r.sender_id === user.id ? 'bg-navy-50 dark:bg-navy-500/10 ml-8' : 'bg-navy-800 mr-8'}`}>
                      <p className="text-xs text-navy-300 mb-1">{r.sender_id === user.id ? 'You' : 'Admin'}</p>
                      <p className="text-sm text-navy-100">{r.message}</p>
                    </div>
                  ))}
                </div>

                {selected.status !== 'Resolved' && (
                  <div className="border-t border-navy-700 pt-4">
                    <textarea
                      aria-label={`Reply to ${selected.subject}`}
                    disabled={loading || repliesLoading || Boolean(repliesError)}
                    value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="input-field"
                      rows={3}
                      placeholder="Type your reply..."
                    />
                    <button onClick={handleSendReply} disabled={loading || repliesLoading || Boolean(repliesError) || !replyText.trim()} className="btn-primary mt-3 flex items-center gap-2 cursor-pointer">
                      <Send className="w-4 h-4" /> {loading ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !showNew && tickets.length > 0 && (
                <div className="card p-8 text-center text-navy-300">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-navy-300" />
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
