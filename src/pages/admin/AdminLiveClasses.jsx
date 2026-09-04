import { useState, useEffect } from 'react';
import { Radio, Square, Trash2, ExternalLink, Video } from 'lucide-react';
import { getAllLiveClasses, addLiveClass, updateLiveClass, deleteLiveClass } from '../../data/dynamicStore';
import { showError, showSuccess } from '../../components/common/Toast';

function getYouTubeEmbedUrl(url) {
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

export default function AdminLiveClasses() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [startingLive, setStartingLive] = useState(false);

  const loadLiveClasses = async () => {
    try {
      setLiveClasses(await getAllLiveClasses());
    } catch (err) {
      console.error('Failed to load live classes:', err);
    }
  };

  useEffect(() => {
    loadLiveClasses();
  }, []);

  const handleStartLive = async () => {
    if (!liveTitle.trim() || !liveUrl.trim()) return showError('Enter a title and YouTube URL.');
    setStartingLive(true);
    try {
      await addLiveClass({
        title: liveTitle.trim(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        description: '',
        room_code: 'LIVE',
        students: 0,
        status: 'Live',
        youtube_url: liveUrl.trim(),
      });
      setLiveTitle('');
      setLiveUrl('');
      await loadLiveClasses();
      showSuccess('Live stream started!');
    } catch (err) {
      showError(err.message || 'Failed to start live stream.');
    }
    setStartingLive(false);
  };

  const handleEndLive = async (id) => {
    try {
      await updateLiveClass(id, { status: 'Ended' });
      await loadLiveClasses();
      showSuccess('Live stream ended.');
    } catch (err) {
      showError(err.message || 'Failed to end live stream.');
    }
  };

  const handleDeleteLive = async (id) => {
    if (!confirm('Delete this live session?')) return;
    try {
      await deleteLiveClass(id);
      await loadLiveClasses();
      showSuccess('Live session deleted.');
    } catch (err) {
      showError(err.message || 'Failed to delete live session.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <h1 className="text-2xl font-bold text-navy-100">Live Classes</h1>
      </div>

      <div className="card animate-grow-in">
        <div className="card-header flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500" />
          <h3 className="text-base sm:text-lg font-semibold">Start New Live</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-100 mb-1">Stream Title</label>
            <input
              type="text"
              value={liveTitle}
              onChange={e => setLiveTitle(e.target.value)}
              placeholder="e.g. Live Lecture: React Hooks"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-100 mb-1">YouTube Live URL</label>
            <input
              type="url"
              value={liveUrl}
              onChange={e => setLiveUrl(e.target.value)}
              placeholder="https://youtube.com/live/..."
              className="input-field"
            />
          </div>
          <button
            onClick={handleStartLive}
            disabled={startingLive || !liveTitle.trim() || !liveUrl.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer"
          >
            <Radio className="w-4 h-4" /> {startingLive ? 'Starting...' : 'Start Live'}
          </button>
        </div>
      </div>

      <div className="card animate-grow-in">
        <div className="card-header flex items-center gap-2">
          <Video className="w-5 h-5 text-navy-500" />
          <h3 className="text-base sm:text-lg font-semibold">All Live Classes</h3>
          <span className="ml-auto text-xs text-navy-200">{liveClasses.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-700 bg-navy-800/60">
                <th className="table-header">Title</th>
                <th className="table-header">Date</th>
                <th className="table-header">Time</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="animate-stagger">
              {liveClasses.slice().reverse().map(lc => (
                <tr key={lc.id} className="border-b border-navy-700 hover:bg-navy-700/60">
                  <td className="table-cell font-medium">{lc.title}</td>
                  <td className="table-cell">{lc.date}</td>
                  <td className="table-cell">{lc.time}</td>
                  <td className="table-cell">
                    <span className={`badge ${
                      lc.status === 'Live' ? 'badge-danger animate-pulse' :
                      lc.status === 'Upcoming' ? 'badge-info' : 'badge-warning'
                    }`}>{lc.status}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {lc.youtube_url && (
                        <a
                          href={lc.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-navy-300 hover:text-navy-600 hover:bg-navy-50 dark:hover:bg-navy-500/10 rounded-lg"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {lc.status === 'Live' && (
                        <button
                          onClick={() => handleEndLive(lc.id)}
                          className="p-1.5 text-navy-300 hover:text-red-600 hover:bg-brand-red/10 rounded-lg cursor-pointer"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteLive(lc.id)}
                        className="p-1.5 text-navy-300 hover:text-red-600 hover:bg-brand-red/10 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {liveClasses.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-navy-300">
                      <Video className="w-10 h-10" />
                      <p className="text-sm">No live classes yet</p>
                      <p className="text-xs">Start a live stream using the form above</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
