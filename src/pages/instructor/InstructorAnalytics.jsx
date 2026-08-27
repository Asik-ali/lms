import { useState, useEffect } from 'react';
import { Users, TrendingUp, Star, BookOpen, CheckCircle } from 'lucide-react';
import { getAllCourses, getAllStudents, getAllEnrollments } from '../../data/dynamicStore';
import { useAuth } from '../../contexts/AuthContext';

export default function InstructorAnalytics() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    (async () => {
      setCourses(await getAllCourses());
      setStudents(await getAllStudents());
      setEnrollments(await getAllEnrollments());
    })();
  }, []);

  const instructorName = user?.name || 'Instructor';
  const myCourses = courses.filter(c => c.instructor === instructorName);
  const myCourseNames = myCourses.map(c => c.title);
  const enrolledStudents = students.filter(s => myCourseNames.includes(s.course));

  const totalStudents = enrolledStudents.length;
  const avgCompletion = enrolledStudents.length > 0 ? Math.round(enrolledStudents.reduce((sum, s) => sum + (s.progress || 0), 0) / enrolledStudents.length) : 0;
  const activeCourses = myCourses.filter(c => c.status === 'Published').length;
  const myEnrollments = enrollments.filter(e => myCourseNames.includes(e.course));

  const distributionRanges = [
    { label: '0-20%', count: enrolledStudents.filter(s => (s.progress || 0) < 20).length, color: 'bg-red-400' },
    { label: '21-40%', count: enrolledStudents.filter(s => (s.progress || 0) >= 20 && (s.progress || 0) < 40).length, color: 'bg-orange-400' },
    { label: '41-60%', count: enrolledStudents.filter(s => (s.progress || 0) >= 40 && (s.progress || 0) < 60).length, color: 'bg-amber-400' },
    { label: '61-80%', count: enrolledStudents.filter(s => (s.progress || 0) >= 60 && (s.progress || 0) < 80).length, color: 'bg-lime-400' },
    { label: '81-100%', count: enrolledStudents.filter(s => (s.progress || 0) >= 80).length, color: 'bg-emerald-400' },
  ];
  const maxDistCount = Math.max(...distributionRanges.map(d => d.count), 1);

  const courseComparison = myCourses.map(c => {
    const courseStudents = enrolledStudents.filter(s => s.course === c.title);
    const avgScore = courseStudents.length ? Math.round(courseStudents.reduce((sum, s) => sum + (s.progress || 0), 0) / courseStudents.length) : 0;
    const completionRate = courseStudents.length ? Math.round(courseStudents.filter(s => (s.progress || 0) >= 80).length / courseStudents.length * 100) : 0;
    return { title: c.title, students: c.students, completionRate, avgScore };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
          <p className="text-sm text-gray-500">Total Students</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-white" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgCompletion}%</p>
          <p className="text-sm text-gray-500">Avg Completion Rate</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{myEnrollments.length}</p>
          <p className="text-sm text-gray-500">Total Enrollments</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center"><BookOpen className="w-5 h-5 text-white" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeCourses}</p>
          <p className="text-sm text-gray-500">Active Courses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <div className={'h-full ' + d.color + ' rounded-full transition-all'} style={{ width: (d.count / maxDistCount) * 100 + '%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Course Comparison</h3>
          </div>
          <div className="p-6 space-y-4">
            {courseComparison.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.students} students</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{c.completionRate}%</p>
                  <p className="text-xs text-gray-400">Avg: {c.avgScore}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
