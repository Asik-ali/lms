import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useLocation } from 'react-router-dom';

const titles = {
  '/admin': 'Dashboard',
  '/admin/calendar': 'Calendar',
  '/admin/students': 'All Students',
  '/admin/students/add': 'Add Student',
  '/admin/courses': 'All Courses',
  '/admin/courses/create': 'Create Course',
  '/admin/courses/categories': 'Categories',
  '/admin/exams/questions': 'Test Series',
  '/admin/live-classes': 'Live Classes',
  '/admin/announcements': 'Announcements',
  '/admin/tickets': 'Student Tickets',
  '/admin/notifications/email': 'Email Notifications',
  '/admin/notifications/push': 'Push Notifications',
  '/admin/settings/smtp': 'SMTP Settings',
  '/admin/settings/backup': 'Backup & Restore',
  '/student': 'Dashboard',
  '/student/courses': 'My Courses',
  '/student/live-classes': 'Live Classes',
  '/student/test-series': 'Test Series',
  '/student/free-test-series': 'Free Test Series',
  '/student/calendar': 'Calendar',
  '/student/announcements': 'Announcements',
  '/student/messages': 'Support Tickets',
  '/student/settings': 'Settings',
};

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const currentPath = Object.keys(titles)
    .filter(k => location.pathname === k || location.pathname.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0] || '';

  return (
    <div className="min-h-screen">
      {mobileMenuOpen && <button onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-30 bg-gray-900/40 lg:hidden" aria-label="Close navigation menu" />}
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="min-w-0 transition-all duration-300 lg:ml-64">
        <Topbar title={titles[currentPath] || 'Dashboard'} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
