import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllCourses } from '../../data/dynamicStore';
import { normalizeCourseAccessSelection } from '../admin/studentCourseAccess';

export default function StudentCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const allCourses = await getAllCourses();
        const assigned = normalizeCourseAccessSelection(user?.course || '');
        const visibleCourses = assigned.length > 0
          ? allCourses.filter(course => assigned.includes(course.title))
          : [];
        if (active) setCourses(visibleCourses);
      } catch (err) {
        console.error('Failed to load courses:', err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.id, user?.course, retry]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-100">My Courses</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p role="status">Loading courses...</p> : error ? <div role="alert" className="col-span-full card p-6"><p>Unable to load your courses.</p><button className="btn-secondary mt-3" onClick={() => setRetry(n => n + 1)}>Retry courses</button></div> : courses.map(c => (
          <div key={c.id} className="card hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="w-12 h-12 rounded-lg bg-navy-50 dark:bg-navy-500/15 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-navy-600 dark:text-navy-300" />
              </div>
              <h3 className="text-lg font-semibold text-navy-100">{c.title}</h3>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-navy-200">Duration: <span className="text-navy-100">{c.duration}</span></p>
                <p className="text-navy-200">Lessons: <span className="text-navy-100">{c.lessons}</span></p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'Published' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-navy-800 text-navy-100'}`}>{c.status}</span>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-navy-700 bg-navy-800/60">
              <button
                type="button"
                onClick={() => navigate(`/student/courses/${c.id}`)}
                className="btn-primary w-full flex items-center justify-center gap-1"
              >
                View Course <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {!loading && !error && courses.length === 0 && (
          <div className="col-span-full text-center py-12 text-navy-300">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-navy-300" />
            <p>No courses enrolled yet</p>
            <button onClick={() => navigate("/student/buy-courses")} className="btn-primary mt-4">Browse courses and prices</button>
          </div>
        )}
      </div>
    </div>
  );
}
