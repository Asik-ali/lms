import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, TrendingUp, Megaphone, Calendar, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllAnnouncements, getAllCourses } from '../../data/dynamicStore';
import { normalizeCourseAccessSelection } from '../admin/studentCourseAccess';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [myCourses, setMyCourses] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const all = await getAllAnnouncements();
        setAnnouncements(all.filter(a => a.status === 'Published').sort((a, b) => new Date(b.created) - new Date(a.created)));
      } catch (err) {
        console.error('Failed to load announcements:', err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const allCourses = await getAllCourses();
        const assigned = normalizeCourseAccessSelection(user?.course || '');
        const visibleCourses = assigned.length > 0
          ? allCourses.filter(course => assigned.includes(course.title))
          : [];
        setMyCourses(visibleCourses);
      } catch (err) {
        console.error('Failed to load courses:', err);
      }
    })();
  }, [user?.course]);

  const stats = [
    { label: 'Enrolled Courses', value: myCourses.length, icon: BookOpen, color: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#071A3D] to-navy-600 rounded-xl p-6 text-white dark:from-navy-900 animate-fade-up">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'Student'}!</h1>
        <p className="text-[#D6E4FA] mt-1">{user?.course || 'Continue your learning journey'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`stat-card animate-fade-up reveal-delay-${i + 1}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${s.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-navy-100">{s.value}</p>
              <p className="text-sm text-navy-200 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card animate-slide-in-right reveal-delay-2">
          <div className="card-header flex justify-between items-center">
            <h3 className="text-lg font-semibold">My Courses</h3>
            <button onClick={() => navigate('/student/courses')} className="text-sm text-navy-600 hover:text-navy-500 dark:hover:text-navy-400 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {myCourses.length > 0 ? myCourses.slice(0, 3).map(c => (
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-navy-700/60">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-navy-100">{c.title}</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-navy-300">{c.duration}</span>
                  </div>
                </div>
                <button type="button" onClick={() => navigate(`/student/courses/${c.id}`)} className="btn-primary whitespace-nowrap">View</button>
              </div>
            )) : (
              <p className="text-navy-300 text-center py-4">No courses enrolled yet</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card animate-zoom-in reveal-delay-3">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-navy-500" />
                Latest Announcements
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {announcements.slice(0, 4).map(a => (
                <div key={a.id} className="flex gap-3 p-2 rounded-lg hover:bg-navy-700/60">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-navy-500" />
                  <div>
                    <p className="text-sm font-medium text-navy-100">{a.title}</p>
                    <p className="text-xs text-navy-200 mt-0.5">{a.created}</p>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-sm text-navy-300 text-center py-2">No announcements yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
