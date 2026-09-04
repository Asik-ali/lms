import { useState, useEffect } from 'react';
import { Megaphone, Calendar } from 'lucide-react';
import { getAllAnnouncements } from '../../data/dynamicStore';

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const all = await getAllAnnouncements();
        setAnnouncements(all.filter(a => a.status === 'Published'));
      } catch (err) {
        console.error('Failed to load announcements:', err);
      }
    })();
  }, []);

  const sorted = [...announcements].sort((a, b) => new Date(b.created) - new Date(a.created));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-100">Announcements</h1>
      </div>

      <div className="space-y-4">
        {sorted.map(a => (
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
        {sorted.length === 0 && (
          <p className="text-navy-200 text-center py-8">No announcements</p>
        )}
      </div>
    </div>
  );
}
