import { useState } from 'react';
import { Search, Mail, User, MessageSquare } from 'lucide-react';
import { students, courses } from '../../data/mockData';

const instructorName = 'Dr. Sarah Chen';

export default function InstructorStudents() {
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('All');

  const instructorCourses = courses.filter(c => c.instructor === instructorName);
  const instructorCourseNames = instructorCourses.map(c => c.title);

  const enrolledStudents = students.filter(s => instructorCourseNames.includes(s.course));

  const filtered = enrolledStudents.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchCourse = filterCourse === 'All' || s.course === filterCourse;
    return matchSearch && matchCourse;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Students</h1>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
          className="input-field max-w-xs"
        >
          <option value="All">All Courses</option>
          {instructorCourseNames.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Name</th>
              <th className="table-header">Email</th>
              <th className="table-header">Course</th>
              <th className="table-header">Progress</th>
              <th className="table-header">Last Active</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-medium">{s.name}</span>
                  </div>
                </td>
                <td className="table-cell text-gray-500">{s.email}</td>
                <td className="table-cell">{s.course}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                      <div
                        className={`h-full rounded-full ${s.progress >= 70 ? 'bg-emerald-500' : s.progress >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${s.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{s.progress}%</span>
                  </div>
                </td>
                <td className="table-cell text-gray-500">{s.enrolled}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Message">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="View Profile">
                      <User className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400">No students found</div>
        )}
      </div>
    </div>
  );
}
