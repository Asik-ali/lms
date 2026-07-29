import { Users, TrendingUp, Star, BookOpen, CheckCircle } from 'lucide-react';
import { courses, students, instructorPerformance } from '../../data/mockData';

const instructorName = 'Dr. Sarah Chen';

export default function InstructorAnalytics() {
  const myCourses = courses.filter(c => c.instructor === instructorName);
  const myCourseNames = myCourses.map(c => c.title);
  const enrolledStudents = students.filter(s => myCourseNames.includes(s.course));

  const totalStudents = enrolledStudents.length;
  const avgCompletion = Math.round(enrolledStudents.reduce((sum, s) => sum + s.progress, 0) / (enrolledStudents.length || 1));
  const avgRating = instructorPerformance.reduce((sum, m) => sum + m.rating, 0) / instructorPerformance.length;
  const activeCourses = myCourses.filter(c => c.status === 'Published').length;

  const maxStudents = Math.max(...instructorPerformance.map(m => m.students));

  const courseComparison = myCourses.map(c => {
    const courseStudents = enrolledStudents.filter(s => s.course === c.title);
    const avgScore = courseStudents.length
      ? Math.round(courseStudents.reduce((sum, s) => sum + s.progress, 0) / courseStudents.length)
      : 0;
    const completionRate = courseStudents.length
      ? Math.round(courseStudents.filter(s => s.progress >= 80).length / courseStudents.length * 100)
      : 0;
    return {
      title: c.title,
      students: c.students,
      completionRate,
      avgScore,
      rating: (4.5 + Math.random() * 0.3).toFixed(1),
    };
  });

  const distributionRanges = [
    { label: '0-20%', count: enrolledStudents.filter(s => s.progress < 20).length, color: 'bg-red-400' },
    { label: '21-40%', count: enrolledStudents.filter(s => s.progress >= 20 && s.progress < 40).length, color: 'bg-orange-400' },
    { label: '41-60%', count: enrolledStudents.filter(s => s.progress >= 40 && s.progress < 60).length, color: 'bg-amber-400' },
    { label: '61-80%', count: enrolledStudents.filter(s => s.progress >= 60 && s.progress < 80).length, color: 'bg-lime-400' },
    { label: '81-100%', count: enrolledStudents.filter(s => s.progress >= 80).length, color: 'bg-emerald-400' },
  ];

  const maxDistCount = Math.max(...distributionRanges.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
          <p className="text-sm text-gray-500">Total Students</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgCompletion}%</p>
          <p className="text-sm text-gray-500">Avg Completion Rate</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
          <p className="text-sm text-gray-500">Average Rating</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeCourses}</p>
          <p className="text-sm text-gray-500">Active Courses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Monthly Performance</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {instructorPerformance.map((m) => (
                <div key={m.month}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 w-12">{m.month}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden mx-3">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${(m.students / maxStudents) * 100}%` }}
                      />
                    </div>
                    <span className="text-gray-500 w-16 text-right">{m.students}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Student Performance Distribution</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {distributionRanges.map(d => (
                <div key={d.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 w-16">{d.label}</span>
                    <span className="text-gray-500">{d.count} students</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${d.color} rounded-full transition-all`}
                      style={{ width: `${(d.count / maxDistCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Course Comparison</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Course</th>
              <th className="table-header">Students</th>
              <th className="table-header">Completion Rate</th>
              <th className="table-header">Avg Score</th>
              <th className="table-header">Rating</th>
            </tr>
          </thead>
          <tbody>
            {courseComparison.map((c, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell font-medium">{c.title}</td>
                <td className="table-cell">{c.students}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${c.completionRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{c.completionRate}%</span>
                  </div>
                </td>
                <td className="table-cell">{c.avgScore}%</td>
                <td className="table-cell">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                    <span>{c.rating}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
