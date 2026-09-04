import { useState, useEffect } from 'react';
import { Radio, Calendar, Clock } from 'lucide-react';
import { getAllLiveClasses } from '../../data/dynamicStore';

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.endsWith('youtube.com')) {
      if (u.pathname === '/embed') return url;
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/live/')) return `https://www.youtube.com/embed/${u.pathname.split('/live/')[1]}`;
    }
  } catch {}
  return null;
}

export default function StudentLiveClasses() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveClasses();
    const interval = setInterval(loadLiveClasses, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadLiveClasses() {
    try {
      const data = await getAllLiveClasses();
      setLiveClasses(data);
    } catch {}
    setLoading(false);
  }

  const activeLive = liveClasses.find(lc => lc.status === 'Live');
  const upcoming = liveClasses.filter(lc => lc.status === 'Upcoming');
  const ended = liveClasses.filter(lc => lc.status === 'Ended');

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-navy-300">Loading live classes...</div>;
  }

  return (
    <div className="space-y-6">
      {activeLive && (
        <div className="card overflow-hidden border-2 border-red-500">
          <div className="bg-red-600 px-6 py-3 flex items-center gap-2">
            <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <h2 className="text-lg font-bold text-white">Live Now</h2>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-2">{activeLive.title}</h3>
            {activeLive.description && <p className="text-sm text-navy-200 mb-4">{activeLive.description}</p>}
            {activeLive.youtube_url ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={getYouTubeEmbedUrl(activeLive.youtube_url)}
                  title={activeLive.title}
                  className="absolute inset-0 w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="bg-navy-800 rounded-lg p-8 text-center text-navy-200">
                <Radio className="w-12 h-12 mx-auto mb-3 text-red-500" />
                <p>Live stream is in progress. No video URL available.</p>
              </div>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-navy-200">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {activeLive.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {activeLive.time}</span>
            </div>
          </div>
        </div>
      )}

      {!activeLive && (
        <div className="card p-12 text-center">
          <Radio className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-navy-100 mb-2">No Live Streams</h3>
          <p className="text-sm text-navy-300">There are no active live streams right now. Check back later.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Classes</h3>
          <div className="grid gap-4">
            {upcoming.map(lc => (
              <div key={lc.id} className="card p-5 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">{lc.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-navy-200">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {lc.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {lc.time}</span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">Upcoming</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ended.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Past Classes</h3>
          <div className="grid gap-4">
            {ended.map(lc => (
              <div key={lc.id} className="card p-5 flex items-center justify-between opacity-60">
                <div>
                  <h4 className="font-semibold text-white">{lc.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-navy-200">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {lc.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {lc.time}</span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-navy-800 text-navy-200 text-xs font-medium rounded-full">Ended</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
