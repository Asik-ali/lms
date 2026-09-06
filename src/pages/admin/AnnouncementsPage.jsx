import { useState, useEffect } from 'react';
import { Megaphone, Send, Trash2 } from 'lucide-react';
import { getAllAnnouncements, addAnnouncement, deleteAnnouncement } from '../../data/dynamicStore';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState('All');
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const targets = ['All', 'Students', 'Admins'];

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    try {
      setAnnouncements(await getAllAnnouncements());
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  }

  async function handlePublish() {
    if (!title.trim() || !content.trim()) return;
    setError('');
    setSuccess('');
    try {
      await addAnnouncement({
        title: title.trim(),
        content: content.trim(),
        target,
        created: new Date().toISOString().split('T')[0],
        status: 'Published',
      });
      setTitle('');
      setContent('');
      setTarget('All');
      setSuccess('Announcement published.');
      refresh();
    } catch (err) {
      setError(err.message || 'Failed to publish announcement.');
      console.error('Failed to publish announcement:', err);
    }
  }

  async function handleDelete(a) {
    if (!window.confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    setError('');
    setSuccess('');
    setDeletingId(a.id);
    try {
      await deleteAnnouncement(a.id);
      setSuccess('Announcement deleted.');
      refresh();
    } catch (err) {
      setError(err.message || 'Failed to delete announcement.');
      console.error('Failed to delete announcement:', err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <h1 className="text-2xl font-bold text-navy-100">Announcements</h1>
      </div>

      <div className="card animate-grow-in">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Create Announcement</h3>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-brand-red/10 border border-brand-red/40 rounded-lg text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">
              {success}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-navy-100 mb-1">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-100 mb-1">Target Audience</label>
              <select value={target} onChange={e => setTarget(e.target.value)} className="input-field w-full">
                {targets.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-100 mb-1">Content</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Write announcement content..." className="input-field w-full resize-none" />
          </div>
          <button onClick={handlePublish} className="flex items-center gap-2 btn-primary cursor-pointer">
            <Send className="w-4 h-4" />
            Publish Announcement
          </button>
        </div>
      </div>

      <div className="space-y-4 animate-stagger">
        {announcements.map(a => (
          <div key={a.id} className="card hover-lift overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-navy-50 dark:bg-navy-500/15 flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-5 h-5 text-navy-600 dark:text-navy-300" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-navy-100 break-words">{a.title}</h4>
                    <p className="text-xs text-navy-300">{a.created}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge-info whitespace-nowrap">{a.target}</span>
                  <span className={`badge whitespace-nowrap ${a.status === 'Published' ? 'badge-success' : 'badge-warning'}`}>{a.status}</span>
                  <button
                    onClick={() => handleDelete(a)}
                    disabled={deletingId === a.id}
                    className="p-2 rounded-lg text-navy-300 hover:text-red-500 hover:bg-brand-red/10 transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-navy-100 leading-relaxed break-words">{a.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
