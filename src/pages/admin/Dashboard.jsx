import { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, Video, Radio, Square, Trash2, ExternalLink, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getAllStudents, getAllInstructors, getAllCourses, getAllEnrollments, getAllLiveClasses, addLiveClass, updateLiveClass, deleteLiveClass, getTestSeries } from '../../data/dynamicStore';
import { showError, showSuccess } from '../../components/common/Toast';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [testSeries, setTestSeries] = useState([]);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [startingLive, setStartingLive] = useState(false);

  useEffect(() => {
    (async () => {
      setStudents(await getAllStudents());
      setInstructors(await getAllInstructors());
      setCourses(await getAllCourses());
      setEnrollments(await getAllEnrollments());
      setLiveClasses(await getAllLiveClasses());
      setTestSeries(await getTestSeries());
    })();
  }, []);

  const activeLive = liveClasses.find(lc => lc.status === 'Live');

  const activeStudents = students.filter(s => s.status === 'Active').length;
  const totalInstructors = instructors.length;
  const publishedCourses = courses.filter(c => c.status === 'Published').length;
  const activeClasses = courses.filter(c => c.status === 'Published').length;

  const statCards = [
    { label: 'Active Students', value: activeStudents, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Instructors', value: totalInstructors, icon: GraduationCap, color: 'bg-emerald-500' },
    { label: 'Published Courses', value: publishedCourses, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Active Classes', value: activeClasses, icon: Video, color: 'bg-amber-500' },
  ];

  const recentEnrollments = [...enrollments].reverse().slice(0, 5);
  const recentNotifications = [
    ...enrollments.filter(e => e.status === 'Pending').slice(0, 3).map(e => ({ id: `e-${e.id}`, message: `New enrollment request from ${e.name}`, time: e.requested, type: 'info' })),
    ...courses.filter(c => c.status === 'Published').slice(0, 2).map(c => ({ id: `c-${c.id}`, message: `Course "${c.title}" is now published`, time: 'Today', type: 'success' })),
    ...(activeLive ? [{ id: 'live-now', message: `LIVE: "${activeLive.title}" is streaming now`, time: 'Now', type: 'danger' }] : []),
  ];

  const handleStartLive = async () => {
    if (!liveTitle.trim() || !liveUrl.trim()) return showError('Enter a title and YouTube URL.');
    setStartingLive(true);
    try {
      await addLiveClass({
        title: liveTitle.trim(),
        instructor: 'Admin',
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
      setLiveClasses(await getAllLiveClasses());
      showSuccess('Live stream started!');
    } catch (err) {
      showError(err.message || 'Failed to start live stream.');
    }
    setStartingLive(false);
  };

  const handleEndLive = async () => {
    if (!activeLive) return;
    try {
      await updateLiveClass(activeLive.id, { status: 'Ended' });
      setLiveClasses(await getAllLiveClasses());
      showSuccess('Live stream ended.');
    } catch (err) {
      showError(err.message || 'Failed to end live stream.');
    }
  };

  const handleDeleteLive = async (id) => {
    if (!confirm('Delete this live session?')) return;
    try {
      await deleteLiveClass(id);
      setLiveClasses(await getAllLiveClasses());
      showSuccess('Live session deleted.');
    } catch (err) {
      showError(err.message || 'Failed to delete live session.');
    }
  };

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

  const enrollmentByMonth = {};
  enrollments.forEach(e => {
    const month = e.requested ? e.requested.substring(0, 7) : 'Unknown';
    enrollmentByMonth[month] = (enrollmentByMonth[month] || 0) + 1;
  });
  const studentProgressData = Object.entries(enrollmentByMonth).sort().map(([month, enrolled]) => ({ month, enrolled, completed: Math.round(enrolled * 0.6) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500" />
            <h3 className="text-base sm:text-lg font-semibold">YouTube Live</h3>
            {activeLive && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full animate-pulse">LIVE</span>}
          </div>
          <div className="p-6">
            {activeLive ? (
              <div className="space-y-4">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={getYouTubeEmbedUrl(activeLive.youtube_url)}
                    title={activeLive.title}
                    className="absolute inset-0 w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{activeLive.title}</p>
                    <p className="text-sm text-gray-500">Started at {activeLive.time}</p>
                  </div>
                  <button onClick={handleEndLive} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">
                    <Square className="w-4 h-4" /> End Live
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Start a YouTube live stream visible to all students.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stream Title</label>
                  <input type="text" value={liveTitle} onChange={e => setLiveTitle(e.target.value)} placeholder="e.g. Live Lecture: React Hooks" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Live URL</label>
                  <input type="url" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder="https://youtube.com/live/..." className="input-field" />
                </div>
                <button onClick={handleStartLive} disabled={startingLive || !liveTitle.trim() || !liveUrl.trim()} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer">
                  <Radio className="w-4 h-4" /> {startingLive ? 'Starting...' : 'Start Live'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-base sm:text-lg font-semibold">Recent Notifications</h3>
          </div>
          <div className="p-4 space-y-3">
            {recentNotifications.map(n => (
              <div key={n.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  n.type === 'info' ? 'bg-blue-500' : n.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div>
                  <p className="text-sm text-gray-700">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
            {recentNotifications.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No recent notifications</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold">Enrollments Over Time</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="enrolled" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold">Test Series</h3>
            <a href="/admin/exams/questions" className="text-sm text-indigo-600 hover:text-indigo-700">Manage</a>
          </div>
          <div className="p-4 space-y-3">
            {testSeries.length > 0 ? testSeries.map(s => (
              <div key={s.name} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.count} questions</p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center py-4">No test series yet</p>
            )}
            {testSeries.length > 0 && (
              <p className="text-xs text-gray-400 text-center pt-2">{testSeries.length} series &middot; {testSeries.reduce((a, s) => a + s.count, 0)} total questions</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base sm:text-lg font-semibold">Live Sessions</h3>
          </div>
          <span className="text-xs text-gray-500">{liveClasses.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="table-header">Title</th>
                <th className="table-header">Instructor</th>
                <th className="table-header">Date</th>
                <th className="table-header">Time</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {liveClasses.slice().reverse().map(lc => (
                <tr key={lc.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="table-cell font-medium">{lc.title}</td>
                  <td className="table-cell text-gray-500">{lc.instructor}</td>
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
                        <a href={lc.youtube_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {lc.status === 'Live' && (
                        <button onClick={async () => { await updateLiveClass(lc.id, { status: 'Ended' }); setLiveClasses(await getAllLiveClasses()); showSuccess('Session ended.'); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                          <Square className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDeleteLive(lc.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {liveClasses.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No live sessions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-semibold">Recent Enrollments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="table-header">Student</th>
                  <th className="table-header">Course</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEnrollments.map(e => (
                  <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell font-medium">{e.name}</td>
                    <td className="table-cell">{e.course}</td>
                    <td className="table-cell">{e.requested}</td>
                    <td className="table-cell">
                      <span className={`badge ${
                        e.status === 'Approved' ? 'badge-success' :
                        e.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                      }`}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-base sm:text-lg font-semibold">Active Courses</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="table-header">Title</th>
                  <th className="table-header">Instructor</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Students</th>
                </tr>
              </thead>
              <tbody>
                {courses.filter(c => c.status === 'Published').map(c => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell font-medium">{c.title}</td>
                    <td className="table-cell">{c.instructor}</td>
                    <td className="table-cell">{c.category}</td>
                    <td className="table-cell">{c.students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
