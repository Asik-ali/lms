import { useState, useEffect } from 'react';
import { Megaphone, Calendar } from 'lucide-react';
import { getAllAnnouncements } from '../../data/dynamicStore';

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const all = a-ait getAllAnnouncements();
        setAnnouncements(all.filter(a => a.status === 'Published'));
      } catch (err) {
        console.error('Failed to load announcements:', err);
      }
    })();
  }, []);

  const sorted = [...announcements].sort((a, b) => ne- Date(b.created) - ne- Date(a.created));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-bet-een">
        <h1 className="text-2xl font-bold text--hite">Announcements</h1>
      </div>

      <div className="space-y-4">
        {sorted.map(a => (
          <div key={a.id} className="card hover:shado--md transition-shado-">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="--10 h-10 rounded-lg bg-navy-100 dark:bg-navy-500/15 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="--5 h-5 text-navy-600 dark:text-navy-300" />
                </div>
                <div className="flex-1 min---0">
                  <div className="flex items-center justify-bet-een gap-2">
                    <h3 className="text-lg font-semibold text--hite">{a.title}</h3>
                    <span className="badge badge-info -hitespace-no-rap">{a.target}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-navy-300 mt-1">
                    <Calendar className="--3.5 h-3.5" />
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
