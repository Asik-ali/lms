import { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, Video, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getStudents, getInstructors, getCourses, getEnrollments } from '../../data/dynamicStore';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    (async () => {
      setStudents(await getStudents());
      setInstructors(await getInstructors());
      setCourses(await getCourses());
      setEnrollments(await getEnrollments());
    })();
  }, []);

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
  ];

  const enrollmentByMonth = {};
  enrollments.forEach(e => {
    const month = e.requested ? e.requested.substring(0, 7) : 'Unknown';
    enrollmentByMonth[month] = (enrollmentByMonth[month] || 0) + 1;
  });
  const studentProgressData = Object.entries(enrollmentByMonth).sort().map(([month, enrolled]) => ({ month, enrolled, completed: Math.round(enrolled * 0.6) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Enrollments Over Time</h3>
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
          <div className="card-header">
            <h3 className="text-lg font-semibold">Recent Notifications</h3>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Enrollments</h3>
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
            <h3 className="text-lg font-semibold">Active Courses</h3>
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
