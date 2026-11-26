import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, Megaphone, BadgeCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllAnnouncements, getAllCourses } from '../../data/dynamicStore';
import { normalizeCourseAccessSelection } from '../admin/studentCourseAccess';
import { isAnnouncementVisible } from '../../data/announcementVisibility';

const shortcuts = [
  { title: 'Test series', description: 'Put your preparation into practice.', to: '/student/test-series', icon: ClipboardList },
  { title: 'Free practice', description: 'Build confidence with free tests.', to: '/student/free-test-series', icon: BadgeCheck },
  { title: 'Student support', description: 'Get help when you need it.', to: '/student/messages', icon: MessageSquare },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrors({});
    setAnnouncements([]);
    setMyCourses([]);
    Promise.allSettled([getAllAnnouncements(), getAllCourses()]).then(([updates, courses]) => {
      if (!active) return;
      setErrors({ announcements: updates.status === 'rejected', courses: courses.status === 'rejected' });
      if (updates.status === 'fulfilled') setAnnouncements(updates.value.filter(a => isAnnouncementVisible(a)).sort((a, b) => new Date(b.created) - new Date(a.created)));
      const assigned = normalizeCourseAccessSelection(user?.course || '');
      if (courses.status === 'fulfilled') setMyCourses(courses.value.filter(course => assigned.includes(course.title)));
    })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, user?.course, retry]);

  return (
    <div className="learning-dashboard">
      <section className="learning-welcome">
        <div>
          <p className="learning-eyebrow">YOUR LEARNING WORKSPACE</p>
          <h1>Welcome back, {user?.name || 'Student'}</h1>
          <p>Make time for your next step. Your preparation starts here.</p>
        </div>
        <Link to="/student/courses" className="btn-primary"><BookOpen size={18} aria-hidden="true" />My courses</Link>
      </section>

      <div className="learning-summary" aria-label="Learning overview">
        <div><span className="learning-icon"><BookOpen size={22} aria-hidden="true" /></span><div><p className="learning-summary-value">{loading || errors.courses ? '—' : myCourses.length}</p><p>Enrolled courses</p></div></div>
        <div><span className="learning-icon"><Megaphone size={22} aria-hidden="true" /></span><div><p className="learning-summary-value">{loading || errors.announcements ? '—' : announcements.length}</p><p>Announcements</p></div></div>
        <div className="learning-summary-note"><BadgeCheck size={24} aria-hidden="true" /><p>Small steps.<br /><strong>Consistent progress.</strong></p></div>
      </div>

      <nav className="learning-shortcuts" aria-label="Learning shortcuts">
        {shortcuts.map(({ title, description, to, icon: Icon }) => <Link key={to} to={to}>
          <Icon size={22} aria-hidden="true" /><div><h2>{title}</h2><p>{description}</p></div>
        </Link>)}
      </nav>

      <div className="learning-columns">
        <section className="card">
          <div className="learning-section-heading"><div><h2>My courses</h2><p>Pick up where your preparation continues.</p></div><Link to="/student/courses">View all</Link></div>
          {loading ? <p role="status" className="p-6 text-navy-300">Loading your courses…</p> : errors.courses ? <div role="alert" className="p-6"><p>We couldn't load your courses.</p><button className="btn-secondary mt-3" onClick={() => setRetry(n => n + 1)}>Retry courses</button></div> : myCourses.length > 0 ? <div className="learning-course-list">
            {myCourses.slice(0, 3).map(c => <div key={c.id} className="learning-course">
              <span className="learning-icon"><BookOpen size={23} aria-hidden="true" /></span>
              <div><h3>{c.title}</h3><p>{c.duration || 'Course materials and learning resources'}</p></div>
              <Link className="btn-secondary" to={`/student/courses/${c.id}`} aria-label={`Open ${c.title}`}>Open course</Link>
            </div>)}
          </div> : <div className="learning-empty"><BookOpen size={32} aria-hidden="true" /><h3>Your next chapter starts here</h3><p>Explore courses to find the right fit for your preparation.</p><Link to="/student/buy-courses" className="btn-secondary">Explore courses</Link></div>}
        </section>
        <section className="card">
          <div className="learning-section-heading"><div><h2>Announcements</h2><p>The latest from your academy.</p></div></div>
          {loading ? <p role="status" className="p-6 text-navy-300">Loading announcements…</p> : errors.announcements ? <div role="alert" className="p-6"><p>We couldn't load announcements.</p><button className="btn-secondary mt-3" onClick={() => setRetry(n => n + 1)}>Retry announcements</button></div> : announcements.length > 0 ? <div className="learning-updates">
            {announcements.slice(0, 4).map(a => <Link key={a.id} to="/student/announcements"><Megaphone size={18} aria-hidden="true" /><div><h3>{a.title}</h3><p>{a.created}</p></div></Link>)}
            <Link className="learning-all-updates" to="/student/announcements">View all announcements</Link>
          </div> : <div className="learning-empty"><Megaphone size={28} aria-hidden="true" /><h3>You’re all caught up</h3><p>New academy updates will appear here.</p></div>}
        </section>
      </div>
    </div>
  );
}
