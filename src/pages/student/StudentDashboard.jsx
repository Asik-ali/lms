import { useState, useEffect } from 'react';
import { BookOpen, ClipboardList, Video, Award, Bell, Calendar, ChevronRight, TrendingUp, Target, BarChart3, CheckCircle, Megaphone } from 'lucide-react';
import { studentCourses, upcomingEvents, certificates, studentReports, students } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { getAnnouncements } from '../../data/dynamicStore';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    (async () => {
      const all = await getAnnouncements();
      setAnnouncements(all.filter(a => a.status === 'Published').sort((a, b) => new Date(b.created) - new Date(a.created)));
    })();
  }, []);

  const student = students.find(s => s.id === user?.id);
  const report = studentReports[user?.id];
  const myCourses = studentCourses.filter(c => c.id <= 3);
  const myCourse = myCourses[0];

  const stats = [
    { label: 'Enrolled Courses', value: myCourses.length, icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Assignments', value: report ? `${report.completedAssignments}/${report.totalAssignments}` : '0/0', icon: ClipboardList, color: 'bg-amber-500' },
    { label: 'Avg Score', value: report ? `${report.avgScore}%` : 'N/A', icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Attendance', value: report ? `${report.attendance}%` : 'N/A', icon: CheckCircle, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {student?.name || 'Student'}!</h1>
        <p className="text-indigo-100 mt-1">{student?.course || 'Continue your learning journey'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${s.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Quiz Average</p>
                <p className="text-xl font-bold text-gray-900">{report.quizAvg}%</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${report.quizAvg}%` }} />
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Assignments Done</p>
                <p className="text-xl font-bold text-gray-900">{report.completedAssignments}/{report.totalAssignments}</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(report.completedAssignments / report.totalAssignments) * 100}%` }} />
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Attendance</p>
                <p className="text-xl font-bold text-gray-900">{report.attendance}%</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${report.attendance}%` }} />
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Class Rank</p>
                <p className="text-xl font-bold text-gray-900">#{report.rank}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">out of {students.length} students</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header flex justify-between items-center">
            <h3 className="text-lg font-semibold">My Courses</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {myCourses.length > 0 ? myCourses.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900">{c.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{c.instructor}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[200px]">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{c.progress}%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Next: {c.nextLesson}</p>
                </div>
                <button className="btn-primary whitespace-nowrap">Continue</button>
              </div>
            )) : (
              <p className="text-gray-400 text-center py-4">No courses enrolled yet</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                Upcoming Events
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {upcomingEvents.map(e => (
                <div key={e.id} className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-200">
                  <div className="text-center min-w-[48px]">
                    <div className="text-sm font-bold text-indigo-600">{e.date.split('-')[2]}</div>
                    <div className="text-xs text-gray-400">{new Date(e.date).toLocaleString('default', { month: 'short' })}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{e.time} &middot; {e.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-500" />
                Latest Announcements
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {announcements.slice(0, 4).map(a => (
                <div key={a.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-indigo-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.created}</p>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">No announcements yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
