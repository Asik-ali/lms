import { useState, useEffect } from 'react';
import { MessageSquare, Send, ArrowLeft, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getTickets, updateTicketStatus, getTicketReplies, addTicketReply, getAllStudents } from '../../data/dynamicStore';
import { showSuccess, showError } from '../../components/common/Toast';

const statusConfig = {
  Open: { icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15' },
  'In Progress': { icon: Clock, color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15' },
  Resolved: { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15' },
};

export default function AdminTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => { loadTickets(); loadStudents(); }, []);

  async function loadTickets() {
    const data = await getTickets();
    setTickets(data);
  }

  async function loadStudents() {
    const data = await getAllStudents();
    setStudents(data);
  }

  function getStudentName(studentId) {
    const s = students.find(s => s.id === studentId);
    return s?.name || 'Unknown Student';
  }

  function getStudentEmail(studentId) {
    const s = students.find(s => s.id === studentId);
    return s?.email || '';
  }

  async function handleSelect(t) {
    setSelected(t);
    const r = await getTicketReplies(t.id);
    setReplies(r);
    if (t.status === 'Open') {
      await updateTicketStatus(t.id, 'In Progress');
      await loadTickets();
      setSelected({ ...t, status: 'In Progress' });
    }
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

  async function handleResolve() {
    if (!selected) return;
    try {
      await updateTicketStatus(selected.id, 'Resolved');
      setSelected({ ...selected, status: 'Resolved' });
      await loadTickets();
      showSuccess('Ticket marked as resolved.');
    } catch (e) {
      showError(e.message);
    }
  }

  const filtered = tickets.filter(t => {
    if (filter === 'All') return true;
    return t.status === filter;
  });

  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Student Tickets</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium">{openCount} Open</span>
          <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium">{inProgressCount} In Progress</span>
          <span className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium">{resolvedCount} Resolved</span>
        </div>
      </div>

      <div className="flex gap-2">
        {['All', 'Open', 'In Progress', 'Resolved'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/60'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {filtered.map(t => {
            const cfg = statusConfig[t.status] || statusConfig.Open;
            const Icon = cfg.icon;
            return (
              <button key={t.id} onClick={() => handleSelect(t)} className={`w-full text-left card p-4 transition-all cursor-pointer ${selected?.id === t.id ? 'border-indigo-300 ring-1 ring-indigo-200' : 'hover:border-gray-300'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.subject}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{getStudentName(t.student_id)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t.status} &middot; {new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No tickets found</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="card p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selected.subject}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[selected.status]?.color || ''}`}>{selected.status}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">From: {getStudentName(selected.student_id)} ({getStudentEmail(selected.student_id)})</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Created {new Date(selected.created_at).toLocaleString()}</p>
                </div>
                {selected.status !== 'Resolved' && (
                  <button onClick={handleResolve} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 cursor-pointer">
                    <CheckCircle className="w-4 h-4" /> Resolve
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{getStudentName(selected.student_id)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selected.message}</p>
                </div>
                {replies.map(r => (
                  <div key={r.id} className={`rounded-lg p-3 ${r.sender_id === user.id ? 'bg-indigo-50 dark:bg-indigo-500/10 ml-8' : 'bg-gray-100 dark:bg-gray-800 mr-8'}`}>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{r.sender_id === user.id ? 'Admin (You)' : getStudentName(r.sender_id)}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{r.message}</p>
                  </div>
                ))}
              </div>

              {selected.status !== 'Resolved' && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
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
            <div className="card p-8 text-center text-gray-400 dark:text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Select a ticket to view and reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
