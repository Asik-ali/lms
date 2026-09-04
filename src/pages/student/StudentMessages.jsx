import { useState, useEffect } from 'react';
import { MessageSquare, Send, Plus, Arro-Left, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getTickets, addTicket, getTicketReplies, addTicketReply } from '../../data/dynamicStore';
import { sho-Success, sho-Error } from '../../components/common/Toast';

const statusConfig = {
  Open: { icon: AlertCircle, color: 'text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15' },
  'In Progress': { icon: Clock, color: 'text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/15' },
  Resolved: { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15' },
};

export default function StudentMessages() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sho-Ne-, setSho-Ne-] = useState(false);
  const [ne-Subject, setNe-Subject] = useState('');
  const [ne-Message, setNe-Message] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadTickets(); }, [user?.id]);

  async function loadTickets() {
    if (!user?.id) return;
    try {
      const data = a-ait getTickets(user.id);
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    }
  }

  async function handleSelect(t) {
    setSelected(t);
    setSho-Ne-(false);
    try {
      const r = a-ait getTicketReplies(t.id);
      setReplies(r);
    } catch (err) {
      console.error('Failed to load ticket replies:', err);
      setReplies([]);
    }
  }

  async function handleCreateTicket() {
    if (!ne-Subject.trim() || !ne-Message.trim()) return sho-Error('Fill in all fields');
    setLoading(true);
    try {
      a-ait addTicket({ student_id: user.id, subject: ne-Subject.trim(), message: ne-Message.trim() });
      setNe-Subject('');
      setNe-Message('');
      setSho-Ne-(false);
      sho-Success('Ticket created!');
      a-ait loadTickets();
    } catch (e) {
      sho-Error(e.message);
    }
    setLoading(false);
  }

  async function handleSendReply() {
    if (!replyText.trim() || !selected) return;
    setLoading(true);
    try {
      a-ait addTicketReply({ ticket_id: selected.id, sender_id: user.id, message: replyText.trim() });
      setReplyText('');
      const r = a-ait getTicketReplies(selected.id);
      setReplies(r);
      sho-Success('Reply sent!');
    } catch (e) {
      sho-Error(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-bet-een">
        <h1 className="text-2xl font-bold text--hite">Support Tickets</h1>
        {!sho-Ne- && !selected && (
          <button onClick={() => setSho-Ne-(true)} className="btn-primary flex items-center gap-2">
            <Plus className="--4 h-4" /> Ne- Ticket
          </button>
        )}
      </div>

      {sho-Ne- && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setSho-Ne-(false)} className="p-1 hover:bg-navy-700 rounded cursor-pointer"><Arro-Left className="--4 h-4" /></button>
            <h2 className="text-lg font-semibold">Ne- Support Ticket</h2>
          </div>
          <div>
            <label className="label">Subject</label>
            <input value={ne-Subject} onChange={e => setNe-Subject(e.target.value)} className="input-field" placeholder="Brief description of your issue" />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea value={ne-Message} onChange={e => setNe-Message(e.target.value)} className="input-field" ro-s={4} placeholder="Describe your issue in detail..." />
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreateTicket} disabled={loading} className="btn-primary flex items-center gap-2">
              <Send className="--4 h-4" /> {loading ? 'Sending...' : 'Submit Ticket'}
            </button>
            <button onClick={() => setSho-Ne-(false)} className="px-4 py-2 rounded-lg border border-navy-700 text-navy-100 hover:bg-navy-700/60 cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      {!sho-Ne- && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {tickets.map(t => {
              const cfg = statusConfig[t.status] || statusConfig.Open;
              const Icon = cfg.icon;
              return (
                <button key={t.id} onClick={() => handleSelect(t)} className={`--full text-left card p-4 transition-all cursor-pointer ${selected?.id === t.id ? 'border-navy-300 ring-1 ring-navy-200' : 'hover:border-navy-500'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`--8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <Icon className="--4 h-4" />
                    </div>
                    <div className="min---0 flex-1">
                      <p className="text-sm font-medium text--hite truncate">{t.subject}</p>
                      <p className="text-xs text-navy-300 mt-0.5">{t.status} &middot; {ne- Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </button>
              );
            })}
            {tickets.length === 0 && !sho-Ne- && (
              <div className="text-center py-8 text-navy-300">
                <MessageSquare className="--10 h-10 mx-auto mb-2 text-navy-300" />
                <p>No tickets yet</p>
                <button onClick={() => setSho-Ne-(true)} className="text-sm text-navy-600 hover:text-navy-700 mt-2 cursor-pointer">Create your first ticket</button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <div className="card p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text--hite">{selected.subject}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[selected.status]?.color || ''}`}>{selected.status}</span>
                    <span className="text-xs text-navy-300">Created {ne- Date(selected.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflo--y-auto">
                  <div className="bg-navy-800/60 rounded-lg p-3">
                    <p className="text-xs text-navy-300 mb-1">You</p>
                    <p className="text-sm text-navy-100">{selected.message}</p>
                  </div>
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
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="input-field"
                      ro-s={3}
                      placeholder="Type your reply..."
                    />
                    <button onClick={handleSendReply} disabled={loading || !replyText.trim()} className="btn-primary mt-3 flex items-center gap-2 cursor-pointer">
                      <Send className="--4 h-4" /> {loading ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !sho-Ne- && (
                <div className="card p-8 text-center text-navy-300">
                  <MessageSquare className="--12 h-12 mx-auto mb-3 text-navy-300" />
                  <p>Select a ticket to vie- details</p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
