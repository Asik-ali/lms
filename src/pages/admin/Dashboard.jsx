import { useState, useEffect } from 'react';
import { Users, BookOpen, FolderOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllStudents, getAllCourses, getAllEnrollments, getAllTestSeries, getAllNotifications, cleanupStaleStudentCourses } from '../../data/dynamicStore';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [testSeries, setTestSeries] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        try { await cleanupStaleStudentCourses(); } catch (e) { console.error('Failed to clean student courses:', e); }
        setStudents(await getAllStudents());
        setCourses(await getAllCourses());
        setEnrollments(await getAllEnrollments());
        setTestSeries(await getAllTestSeries());
        setNotifications(await getAllNotifications());
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    })();
  }, []);

  const activeStudents = students.filter(s => s.status === 'Active').length;
  const publishedCourses = courses.filter(c => c.status === 'Published').length;
  const totalTestSeries = testSeries.length;

  const statCards = [
    { label: 'Active Students', value: activeStudents, icon: Users, color: 'bg-blue-500' },
    { label: 'Published Courses', value: publishedCourses, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Test Series', value: totalTestSeries, icon: FolderOpen, color: 'bg-emerald-500' },
  ];

  const recentNotifications = [...notifications].slice(0, 5);

  const enrollmentByMonth = {};
  enrollments.forEach(e => {
    const month = e.requested ? e.requested.substring(0, 7) : 'Unknown';
    enrollmentByMonth[month] = (enrollmentByMonth[month] || 0) + 1;
  });
  const studentProgressData = Object.entries(enrollmentByMonth).sort().map(([month, enrolled]) => ({ month, enrolled }));

  const studentsPerCourse = (title) => {
    if (!title) return 0;
    return students.filter(s =>
      (s.course || '')
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)
        .includes(title)
    ).length;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
            </div>
          );
        })}
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
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-base sm:text-lg font-semibold">Recent Notifications</h3>
          </div>
          <div className="p-4 space-y-3">
            {recentNotifications.map(n => (
              <div key={n.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  n.type === 'info' ? 'bg-blue-500' : n.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{n.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
            {recentNotifications.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No recent notifications</p>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold">Test Series</h3>
          <a href="/admin/exams/questions" className="text-sm text-indigo-600 hover:text-indigo-700">Manage</a>
        </div>
        <div className="p-4 space-y-3">
          {testSeries.length > 0 ? testSeries.slice(0, 5).map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-indigo-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center">
                  <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.name}</p>
                  {s.description && <p className="text-xs text-gray-400 dark:text-gray-500">{s.description}</p>}
                </div>
              </div>
            </div>
          )) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No test series yet</p>
          )}
          {testSeries.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-2">{testSeries.length} series &middot; {testSeries.reduce((a, s) => a + s.count, 0)} total questions</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="text-base sm:text-lg font-semibold">Active Courses</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="table-header">Title</th>
                  <th className="table-header">Students</th>
                </tr>
              </thead>
              <tbody>
                {courses.filter(c => c.status === 'Published').map(c => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="table-cell font-medium">{c.title}</td>
                    <td className="table-cell">{studentsPerCourse(c.title)}</td>
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
