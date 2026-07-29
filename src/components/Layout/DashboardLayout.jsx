import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useLocation } from 'react-router-dom';

const titles = {
  '/admin': 'Dashboard',
  '/admin/students': 'All Students',
  '/admin/students/add': 'Add Student',
  '/admin/students/profile': 'Student Profile',
  '/admin/students/attendance': 'Student Attendance',
  '/admin/students/progress': 'Student Progress',
  '/admin/students/suspend': 'Suspend / Delete Student',
  '/admin/instructors': 'All Instructors',
  '/admin/instructors/add': 'Add Instructor',
  '/admin/instructors/performance': 'Instructor Performance',
  '/admin/instructors/courses': 'Assigned Courses',
  '/admin/courses': 'All Courses',
  '/admin/courses/create': 'Create Course',
  '/admin/courses/categories': 'Categories',
  '/admin/courses/sections': 'Course Sections',
  '/admin/courses/lessons': 'Lessons',
  '/admin/courses/materials': 'Learning Materials',
  '/admin/courses/assign': 'Assign Instructor',
  '/admin/enrollment/new': 'New Enrollment',
  '/admin/enrollment/pending': 'Pending Requests',
  '/admin/enrollment/assignments': 'Course Assignments',
  '/admin/assignments/create': 'Create Assignment',
  '/admin/assignments/submissions': 'Student Submissions',
  '/admin/assignments/grade': 'Grade Assignment',
  '/admin/exams/questions': 'Question Bank',
  '/admin/exams/create': 'Create Quiz',
  '/admin/exams/results': 'Results',
  '/admin/exams/leaderboard': 'Leaderboard',
  '/admin/attendance/students': 'Student Attendance',
  '/admin/attendance/class': 'Class Attendance',
  '/admin/attendance/reports': 'Attendance Reports',
  '/admin/announcements': 'Announcements',
  '/admin/reports/students': 'Student Report',
  '/admin/reports/courses': 'Course Report',
  '/admin/reports/attendance': 'Attendance Report',
  '/admin/reports/performance': 'Performance Report',
  '/admin/cms/homepage': 'Homepage',
  '/admin/cms/about': 'About',
  '/admin/cms/contact': 'Contact',
  '/admin/cms/faq': 'FAQ',
  '/admin/cms/blog': 'Blog',
  '/admin/notifications/email': 'Email Notifications',
  '/admin/notifications/sms': 'SMS Notifications',
  '/admin/notifications/push': 'Push Notifications',
  '/admin/settings/general': 'General Settings',
  '/admin/settings/roles': 'Roles & Permissions',
  '/admin/settings/smtp': 'SMTP Settings',
  '/admin/settings/api-keys': 'API Keys',
  '/admin/settings/backup': 'Backup & Restore',
  '/admin/audit': 'Audit Log',
  '/student': 'Dashboard',
  '/student/courses': 'My Courses',
  '/student/continue': 'Continue Learning',
  '/student/recorded': 'Recorded Classes',
  '/student/assignments': 'Assignments',
  '/student/quizzes': 'Quizzes',
  '/student/attendance': 'Attendance',
  '/student/calendar': 'Calendar',
  '/student/announcements': 'Announcements',
  '/student/messages': 'Messages',
  '/student/profile': 'Profile',
  '/student/settings': 'Settings',
  '/instructor': 'Dashboard',
  '/instructor/courses': 'My Courses',
  '/instructor/students': 'Students',
  '/instructor/content': 'Course Content',
  '/instructor/recorded': 'Recorded Classes',
  '/instructor/assignments': 'Assignments',
  '/instructor/quizzes': 'Quizzes',
  '/instructor/attendance': 'Attendance',
  '/instructor/announcements': 'Announcements',
  '/instructor/analytics': 'Analytics',
  '/instructor/messages': 'Messages',
  '/instructor/profile': 'Profile',
  '/instructor/settings': 'Settings',
};

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  const currentPath = Object.keys(titles).find(k => location.pathname === k || location.pathname.startsWith(k)) || '';

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="transition-all duration-300" style={{ marginLeft: '16rem' }}>
        <Topbar title={titles[currentPath] || 'Dashboard'} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
