import { useState, useEffect } from 'react';
import { Users, BookOpen, CheckCircle, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { getStudents, getCourses, getAttendance, getEnrollments } from '../../data/dynamicStore';

const tabs = ['Student Report', 'Course Report', 'Attendance Report', 'Performance Report'];

function StudentReport({ students }) {
  const total = students.length;
  const active = students.filter(s => s.status === 'Active').length;
  const avgProgress = total > 0 ? Math.round(students.reduce((s, a) => s + (a.progress || 0), 0) / total) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
          </div>
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-sm text-gray-500">Total Students</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div>
          </div>
          <p className="text-2xl font-bold">{active}</p>
          <p className="text-sm text-gray-500">Active Students</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
          </div>
          <p className="text-2xl font-bold">{avgProgress}%</p>
          <p className="text-sm text-gray-500">Avg Progress</p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="card-header"><h3 className="text-lg font-semibold">Student List</h3></div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Name</th>
              <th className="table-header">Course</th>
              <th className="table-header">Status</th>
              <th className="table-header">Progress</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell font-medium">{s.name}</td>
                <td className="table-cell">{s.course}</td>
                <td className="table-cell"><span className={`badge ${s.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{s.status}</span></td>
                <td className="table-cell">{Math.round(s.progress || 0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CourseReport({ courses }) {
  const published = courses.filter(c => c.status === 'Published').length;
  const totalLessons = courses.reduce((s, c) => s + (c.lessons || 0), 0);
  const totalStudentsEnrolled = courses.reduce((s, c) => s + (c.students || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center"><BookOpen className="w-5 h-5 text-indigo-600" /></div></div>
          <p className="text-2xl font-bold">{courses.length}</p>
          <p className="text-sm text-gray-500">Total Courses</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div></div>
          <p className="text-2xl font-bold">{published}</p>
          <p className="text-sm text-gray-500">Published</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Users className="w-5 h-5 text-amber-600" /></div></div>
          <p className="text-2xl font-bold">{totalStudentsEnrolled}</p>
          <p className="text-sm text-gray-500">Total Enrollments</p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="card-header"><h3 className="text-lg font-semibold">Course Details</h3></div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Title</th>
              <th className="table-header">Instructor</th>
              <th className="table-header">Students</th>
              <th className="table-header">Lessons</th>
              <th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell font-medium">{c.title}</td>
                <td className="table-cell">{c.instructor}</td>
                <td className="table-cell">{c.students}</td>
                <td className="table-cell">{c.lessons}</td>
                <td className="table-cell"><span className={`badge ${c.status === 'Published' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttendanceReportTab({ attendanceRecords }) {
  const avgPct = attendanceRecords.length > 0 ? Math.round(attendanceRecords.reduce((s, a) => s + (a.percentage || 0), 0) / attendanceRecords.length) : 0;
  const totalPresent = attendanceRecords.reduce((s, a) => s + (a.present || 0), 0);
  const totalSessions = attendanceRecords.reduce((s, a) => s + (a.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-blue-600" /></div></div>
          <p className="text-2xl font-bold">{avgPct}%</p>
          <p className="text-sm text-gray-500">Avg Attendance</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div></div>
          <p className="text-2xl font-bold">{totalPresent}/{totalSessions}</p>
          <p className="text-sm text-gray-500">Sessions Attended</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div></div>
          <p className="text-2xl font-bold">{attendanceRecords.length}</p>
          <p className="text-sm text-gray-500">Students Tracked</p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="card-header"><h3 className="text-lg font-semibold">Attendance Breakdown</h3></div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Name</th>
              <th className="table-header">Course</th>
              <th className="table-header">Present</th>
              <th className="table-header">Total</th>
              <th className="table-header">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRecords.map(a => (
              <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell font-medium">{a.name}</td>
                <td className="table-cell">{a.course}</td>
                <td className="table-cell">{a.present}</td>
                <td className="table-cell">{a.total}</td>
                <td className="table-cell"><span className={`badge ${a.percentage >= 80 ? 'badge-success' : a.percentage >= 60 ? 'badge-warning' : 'badge-danger'}`}>{a.percentage}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PerformanceReport({ enrollments, students }) {
  const total = enrollments.length;
  const approved = enrollments.filter(e => e.status === 'Approved').length;
  const pending = enrollments.filter(e => e.status === 'Pending').length;
  const totalStudents = students.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center"><Award className="w-5 h-5 text-yellow-600" /></div></div>
          <p className="text-2xl font-bold">{totalStudents}</p>
          <p className="text-sm text-gray-500">Total Students</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-indigo-600" /></div></div>
          <p className="text-2xl font-bold">{approved}</p>
          <p className="text-sm text-gray-500">Approved Enrollments</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Users className="w-5 h-5 text-green-600" /></div></div>
          <p className="text-2xl font-bold">{pending}</p>
          <p className="text-sm text-gray-500">Pending Requests</p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="card-header"><h3 className="text-lg font-semibold">Enrollment Status</h3></div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Name</th>
              <th className="table-header">Course</th>
              <th className="table-header">Requested</th>
              <th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map(e => (
              <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell font-medium">{e.name}</td>
                <td className="table-cell">{e.course}</td>
                <td className="table-cell">{e.requested}</td>
                <td className="table-cell"><span className={`badge ${e.status === 'Approved' ? 'badge-success' : e.status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    (async () => {
      setStudents(await getStudents());
      setCourses(await getCourses());
      setAttendanceRecords(await getAttendance());
      setEnrollments(await getEnrollments());
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-0 -mb-px">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                i === activeTab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 0 && <StudentReport students={students} />}
      {activeTab === 1 && <CourseReport courses={courses} />}
      {activeTab === 2 && <AttendanceReportTab attendanceRecords={attendanceRecords} />}
      {activeTab === 3 && <PerformanceReport enrollments={enrollments} students={students} />}
    </div>
  );
}
