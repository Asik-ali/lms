import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/Layout/DashboardLayout';
import PublicLayout from './components/Layout/PublicLayout';
import ToastContainer from './components/common/Toast';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import FAQPage from './pages/public/FAQPage';
import AdminDashboard from './pages/admin/Dashboard';
import StudentManagement from './pages/admin/StudentManagement';
import InstructorManagement from './pages/admin/InstructorManagement';
import CourseManagement from './pages/admin/CourseManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import Enrollment from './pages/admin/Enrollment';
import QuestionBank from './pages/admin/ExamsQuizzes';

import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import ReportsPage from './pages/admin/ReportsPage';
import CMSPage from './pages/admin/CMSPage';
import NotificationsPage from './pages/admin/NotificationsPage';
import SettingsPage from './pages/admin/SettingsPage';
import AuditPage from './pages/admin/AuditPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCourses from './pages/student/StudentCourses';
import StudentCourseDetail from './pages/student/StudentCourseDetail';
import StudentLiveClasses from './pages/student/StudentLiveClasses';

import StudentAnnouncements from './pages/student/StudentAnnouncements';
import ProfilePage from './pages/ProfilePage';

function RoleGuard({ role, children }) {
  const { user } = useAuth();
  if (user?.role === 'instructor') return <Navigate to="/admin" replace />;
  if (user?.role !== role) return <Navigate to={`/${user?.role || 'admin'}`} replace />;
  return children;
}

function AppRoutes() {
  const { user, logout } = useAuth();

  if (!user) return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
      </Route>
      <Route path="/admin" element={<RoleGuard role="admin"><DashboardLayout /></RoleGuard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="students/add" element={<StudentManagement />} />
        <Route path="students/profile" element={<StudentManagement />} />
        <Route path="students/progress" element={<StudentManagement />} />
        <Route path="instructors" element={<InstructorManagement />} />
        <Route path="instructors/add" element={<InstructorManagement />} />
        <Route path="instructors/performance" element={<InstructorManagement />} />
        <Route path="instructors/courses" element={<InstructorManagement />} />
        <Route path="courses" element={<CourseManagement />} />
        <Route path="courses/create" element={<CourseManagement />} />
        <Route path="courses/categories" element={<CategoryManagement />} />
        <Route path="courses/sections" element={<CourseManagement />} />
        <Route path="courses/lessons" element={<CourseManagement />} />
        <Route path="courses/materials" element={<CourseManagement />} />
        <Route path="courses/assign" element={<CourseManagement />} />
        <Route path="enrollment/new" element={<Enrollment />} />
        <Route path="enrollment/pending" element={<Enrollment />} />
        <Route path="enrollment/assignments" element={<Enrollment />} />
        <Route path="exams/questions" element={<QuestionBank />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="reports/students" element={<ReportsPage />} />
        <Route path="reports/courses" element={<ReportsPage />} />
        <Route path="reports/attendance" element={<ReportsPage />} />
        <Route path="reports/performance" element={<ReportsPage />} />
        <Route path="cms/homepage" element={<CMSPage />} />
        <Route path="cms/about" element={<CMSPage />} />
        <Route path="cms/contact" element={<CMSPage />} />
        <Route path="cms/faq" element={<CMSPage />} />
        <Route path="cms/blog" element={<CMSPage />} />
        <Route path="notifications/email" element={<NotificationsPage />} />
        <Route path="notifications/sms" element={<NotificationsPage />} />
        <Route path="notifications/push" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings/general" element={<SettingsPage />} />
        <Route path="settings/roles" element={<SettingsPage />} />
        <Route path="settings/smtp" element={<SettingsPage />} />
        <Route path="settings/api-keys" element={<SettingsPage />} />
        <Route path="settings/backup" element={<SettingsPage />} />
        <Route path="audit" element={<AuditPage />} />
      </Route>

      <Route path="/student" element={<RoleGuard role="student"><DashboardLayout /></RoleGuard>}>
        <Route index element={<StudentDashboard />} />
        <Route path="courses" element={<StudentCourses />} />
        <Route path="courses/:courseId" element={<StudentCourseDetail />} />
        <Route path="continue" element={<StudentCourseDetail courseId="1" />} />
        <Route path="live-classes" element={<StudentLiveClasses />} />
        <Route path="calendar" element={<StudentDashboard />} />
        <Route path="announcements" element={<StudentAnnouncements />} />
        <Route path="messages" element={<StudentDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={`/${user.role}`} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}
