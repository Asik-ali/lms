import { useState, useEffect } from 'react';
import { BookOpen, Users, Video, Star, Calendar, FileText, TrendingUp } from 'lucide-react';
import { getCourses, getStudents, getLiveClasses, getAnnouncements } from '../../data/dynamicStore';
import { useAuth } from '../../contexts/AuthContext';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    (async () => {
      setCourses(await getCourses());
      setStudents(await getStudents());
      setLiveClasses(await getLiveClasses());
      setAnnouncements(await getAnnouncements());
    })();
  }, []);

  const instructorName = user?.name || 'Instructor';
  const myCourses = courses.filter(c => c.instructor === instructorName);
  const totalStudents = myCourses.reduce((sum, c) => sum + (c.students || 0), 0);
  const activeClasses = liveClasses.filter(lc => lc.instructor === instructorName && lc.status === 'Upcoming').length;

  const stats = [
    { label: 'My Courses', value: myCourses.length, icon: BookOpen, color: 'bg-indigo-500' },
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'bg-emerald-500' },
    { label: 'Active Classes', value: activeClasses, icon: Video, color: 'bg-amber-500' },
    { label: 'Published Courses', value: myCourses.filter(c => c.status === 'Published').length, icon: Star, color: 'bg-rose-500' },
  ];

  const recentActivity = [
    ...students.filter(s => myCourses.some(c => c.title === s.course)).slice(0, 3).map(s => ({ id: `s-${s.id}`, text: `${s.name} enrolled in ${s.course}`, time: s.created_at?.split('T')[0] || 'Recently', type: 'student' })),
    ...liveClasses.filter(lc => lc.instructor === instructorName && lc.status === 'Upcoming').slice(0, 2).map(lc => ({ id: `lc-${lc.id}`, text: `Upcoming: ${lc.title} on ${lc.date}`, time: lc.date, type: 'class' })),
  ];

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Welcome back, {instructorName}</h1>
          <p className="text-indigo-200 mt-1">Instructor Dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">My Courses</h3>
          </div>
          <div className="p-6">
            {myCourses.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No courses assigned yet</p>
            ) : (
              <div className="space-y-4">
                {myCourses.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{c.title}</p>
                      <p className="text-sm text-gray-500">{c.students} students &middot; {c.lessons} lessons</p>
                    </div>
                    <span className={`badge ${c.status === 'Published' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
          <div className="p-4 space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map(a => (
                <div key={a.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${a.type === 'student' ? 'bg-green-50' : 'bg-blue-50'}`}>
                    {a.type === 'student' ? <Users className="w-4 h-4 text-green-600" /> : <Calendar className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{a.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Create Assignment</p>
              <p className="text-xs text-gray-500">Post new assignment</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Schedule Class</p>
              <p className="text-xs text-gray-500">Plan live session</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">View Reports</p>
              <p className="text-xs text-gray-500">Analytics & insights</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
