import { useState, useEffect } from 'react';
import { BookOpen, Users, FileText, Eye, Edit2, Search } from 'lucide-react';
import { getAllCourses } from '../../data/dynamicStore';
import { useAuth } from '../../contexts/AuthContext';

export default function InstructorCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => { setCourses(await getAllCourses()); })();
  }, []);

  const instructorName = user?.name || 'Instructor';
  const myCourses = courses.filter(c => c.instructor === instructorName);
  const filtered = myCourses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(c => {
          const progress = c.status === 'Published' ? 100 : 40;
          return (
            <div key={c.id} className="card hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{c.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{c.category}</p>
                  </div>
                  <span className={`badge ${c.status === 'Published' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{c.students} students</span>
                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{c.lessons} lessons</span>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-700">{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"><FileText className="w-3.5 h-3.5" /> Manage Content</button>
                  <button className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"><Eye className="w-3.5 h-3.5" /> View Students</button>
                  <button className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No courses found</p>
        </div>
      )}
    </div>
  );
}
