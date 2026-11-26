import { useState, useEffect } from 'react';
import { Megaphone, Calendar } from 'lucide-react';
import { getAllAnnouncements } from '../../data/dynamicStore';
import { isAnnouncementVisible } from '../../data/announcementVisibility';

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const all = await getAllAnnouncements();
        if (active) setAnnouncements(all.filter(a => isAnnouncementVisible(a)));
      } catch (err) {
        console.error('Failed to load announcements:', err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [retry]);

  const sorted = [...announcements].sort((a, b) => new Date(b.created) - new Date(a.created));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-100">Announcements</h1>
      </div>

      <div className="space-y-4">
        {loading ? <p role="status">Loading announcements...</p> : error ? <div role="alert" className="card p-6"><p>Unable to load announcements.</p><button className="btn-secondary mt-3" onClick={() => setRetry(n => n + 1)}>Retry announcements</button></div> : sorted.map(a => (
          <div key={a.id} className="card hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-navy-50 dark:bg-navy-500/15 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-navy-600 dark:text-navy-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-navy-100">{a.title}</h3>
                    <span className="badge badge-info whitespace-nowrap">{a.target}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-navy-300 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {a.created}
                  </div>
                  <p className="text-sm text-navy-100 mt-3">{a.content}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!loading && !error && sorted.length === 0 && (
          <p className="text-navy-200 text-center py-8">No announcements</p>
        )}
      </div>
    </div>
  );
}
