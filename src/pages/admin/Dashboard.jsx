import { Users, GraduationCap, BookOpen, Video, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { stats, recentEnrollments, notifications, studentProgressData, revenueData } from '../../data/mockData';

const statCards = [
  { label: 'Total Students', value: stats.totalStudents, change: stats.studentChange, icon: Users, color: 'bg-blue-500' },
  { label: 'Total Instructors', value: stats.totalInstructors, change: stats.instructorChange, icon: GraduationCap, color: 'bg-emerald-500' },
  { label: 'Total Courses', value: stats.totalCourses, change: stats.courseChange, icon: BookOpen, color: 'bg-purple-500' },
  { label: 'Active Classes', value: stats.activeClasses, change: stats.classChange, icon: Video, color: 'bg-amber-500' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isUp = card.change >= 0;
          return (
            <div key={card.label} className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`flex items-center gap-1 text-sm font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                  {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(card.change)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Student Enrollment & Progress</h3>
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
            {notifications.map(n => (
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
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Enrollments</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-700">View All</button>
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
                    <td className="table-cell">{e.date}</td>
                    <td className="table-cell">
                      <span className={`badge ${
                        e.status === 'Completed' ? 'badge-success' :
                        e.status === 'Pending' ? 'badge-warning' : 'badge-info'
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
            <h3 className="text-lg font-semibold">Revenue Overview</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
