import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, Video,
  Megaphone, Settings,
  LogOut, ChevronDown, ChevronRight, Calendar, MessageSquare,
  UserCircle, PenTool, Bell, X,
  BadgeCheck, ShoppingCart,
} from 'lucide-react';

const adminNav = [
  { section: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { section: 'Calendar', icon: Calendar, path: '/admin/calendar' },
  {
    section: 'Student Management', icon: Users, submenu: [
      { label: 'All Students', path: '/admin/students' },
      { label: 'Add Student', path: '/admin/students/add' },
    ]
  },
  {
    section: 'Course Management', icon: BookOpen, submenu: [
      { label: 'All Courses', path: '/admin/courses' },
      { label: 'Create Course', path: '/admin/courses/create' },

    ]
  },
  { section: 'Test Series', icon: PenTool, path: '/admin/exams/questions' },
  { section: 'Sales Plans', icon: ShoppingCart, path: '/admin/sales-plans' },
  { section: 'Live Classes', icon: Video, path: '/admin/live-classes' },
  { section: 'Announcements', icon: Megaphone, path: '/admin/announcements' },
  { section: 'Student Tickets', icon: MessageSquare, path: '/admin/tickets' },
  {
    section: 'Notifications', icon: Bell, submenu: [
      { label: 'Email', path: '/admin/notifications/email' },
      { label: 'Push Notifications', path: '/admin/notifications/push' },
    ]
  },
  {
    section: 'Settings', icon: Settings, submenu: [
      { label: 'SMTP', path: '/admin/settings/smtp' },
      { label: 'Backup & Restore', path: '/admin/settings/backup' },
    ]
  },
];

const studentNav = [
  { section: 'Dashboard', icon: LayoutDashboard, path: '/student' },
  { section: 'My Courses', icon: BookOpen, path: '/student/courses' },
  { section: 'Live Classes', icon: Video, path: '/student/live-classes' },
  { section: 'Test Series', icon: PenTool, path: '/student/test-series' },
  { section: 'Free Test Series', icon: BadgeCheck, path: '/student/free-test-series' },
  { section: 'Buy Courses', icon: ShoppingCart, path: '/student/buy-courses' },
  { section: 'Calendar', icon: Calendar, path: '/student/calendar' },
  { section: 'Announcements', icon: Megaphone, path: '/student/announcements' },
  { section: 'Messages', icon: MessageSquare, path: '/student/messages' },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});

  const role = user?.role === 'instructor' ? 'admin' : (user?.role || 'admin');
  const navItems = role === 'student' ? studentNav : adminNav;

  const toggleExpand = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const isActive = (path) => {
    if (!path) return false;
    if (path === `/${role}`) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const hasActiveSubmenu = (item) => {
    if (!item.submenu) return false;
    return item.submenu.some(sub => isActive(sub.path));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    admin: 'bg-indigo-600',
    student: 'bg-emerald-600',
  };

  const roleLabels = {
    admin: 'Administrator',
    instructor: 'Administrator',
    student: 'Student',
  };

  return (
    <aside className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200 dark:border-gray-800">
        <BookOpen className="w-6 h-6 text-indigo-600 flex-shrink-0" />
        <span className="font-bold text-lg">Lead Academy</span>
        <button onClick={onClose} className="ml-auto p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer lg:hidden" aria-label="Close navigation menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className={`w-6 h-6 rounded-md ${roleColors[role]} flex items-center justify-center flex-shrink-0`}>
            <Users className="w-3 h-3 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{user?.name || roleLabels[role]}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{roleLabels[role]}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasSub = item.submenu && item.submenu.length > 0;
          const expandedItem = expanded[item.section] ?? hasActiveSubmenu(item);

          if (hasSub) {
            return (
              <div key={item.section}>
                <button onClick={() => toggleExpand(item.section)} className={`w-full sidebar-link ${hasActiveSubmenu(item) ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <>
                    <span className="flex-1 text-left truncate">{item.section}</span>
                    {expandedItem ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </>
                </button>
                {expandedItem && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.submenu.map(sub => (
                      <NavLink key={sub.path} to={sub.path} onClick={onClose} className={({ isActive: active }) => `sidebar-link text-xs ${active ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}>
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink key={item.section} to={item.path} end onClick={onClose} className={({ isActive: active }) => `sidebar-link ${active ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.section}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <button onClick={handleLogout} className="w-full sidebar-link sidebar-link-inactive text-red-500 hover:text-red-700 hover:bg-red-50">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
