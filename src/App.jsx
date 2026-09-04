import { Bro-serRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import DashboardLayout from './components/Layout/DashboardLayout';
import PublicLayout from './components/Layout/PublicLayout';
import ToastContainer from './components/common/Toast';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import FAQPage from './pages/public/FAQPage';
import TermsPage from './pages/public/TermsPage';
import RefundPolicyPage from './pages/public/RefundPolicyPage';

import AdminDashboard from './pages/admin/Dashboard';
import StudentManagement from './pages/admin/StudentManagement';
import CourseManagement from './pages/admin/CourseManagement';
import QuestionBank from './pages/admin/ExamsQuizzes';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import NotificationsPage from './pages/admin/NotificationsPage';
import SettingsPage from './pages/admin/SettingsPage';
import AdminTickets from './pages/admin/AdminTickets';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminLiveClasses from './pages/admin/AdminLiveClasses';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCourses from './pages/student/StudentCourses';
import StudentCourseDetail from './pages/student/StudentCourseDetail';
import StudentLiveClasses from './pages/student/StudentLiveClasses';
import StudentMessages from './pages/student/StudentMessages';
import StudentCalendar from './pages/student/StudentCalendar';
import StudentTestSeries from './pages/student/StudentTestSeries';
import StudentFreeTestSeries from './pages/student/StudentFreeTestSeries';
import StudentTestDetail from './pages/student/StudentTestDetail';
import StudentTestTaking from './pages/student/StudentTestTaking';
import StudentTestResult from './pages/student/StudentTestResult';

import StudentAnnouncements from './pages/student/StudentAnnouncements';

function RoleGuard({ role, children }) {
  const { user } = useAuth();
  const effectiveRole = user?.role === 'instructor' ? 'admin' : user?.role;
  if (effectiveRole !== role) return <Navigate to={`/${effectiveRole || 'admin'}`} replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950">
      <div className="text-center">
        <div className="--10 h-10 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-navy-200">Loading...</p>
      </div>
    </div>
  );

  if (!user) return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refunds" element={<RefundPolicyPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refunds" element={<RefundPolicyPage />} />
      </Route>
      <Route path="/admin" element={<RoleGuard role="admin"><DashboardLayout /></RoleGuard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="calendar" element={<AdminCalendar />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="students/add" element={<StudentManagement />} />
        <Route path="students/profile" element={<StudentManagement />} />
        <Route path="students/progress" element={<StudentManagement />} />
        <Route path="students/suspend" element={<StudentManagement />} />
        <Route path="courses" element={<CourseManagement />} />
        <Route path="courses/create" element={<CourseManagement />} />
        <Route path="exams/questions" element={<QuestionBank />} />
        <Route path="live-classes" element={<AdminLiveClasses />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="notifications/email" element={<NotificationsPage />} />
        <Route path="notifications/push" element={<NotificationsPage />} />
        <Route path="settings/smtp" element={<SettingsPage />} />
        <Route path="settings/backup" element={<SettingsPage />} />
      </Route>

      <Route path="/student" element={<RoleGuard role="student"><DashboardLayout /></RoleGuard>}>
        <Route index element={<StudentDashboard />} />
        <Route path="courses" element={<StudentCourses />} />
        <Route path="courses/:courseId" element={<StudentCourseDetail />} />
        <Route path="live-classes" element={<StudentLiveClasses />} />
        <Route path="test-series" element={<StudentTestSeries />} />
        <Route path="free-test-series" element={<StudentFreeTestSeries />} />
        <Route path="test/:testId" element={<StudentTestDetail />} />
        <Route path="test/take/:attemptId" element={<StudentTestTaking />} />
        <Route path="test/result/:attemptId" element={<StudentTestResult />} />
        <Route path="calendar" element={<StudentCalendar />} />
        <Route path="announcements" element={<StudentAnnouncements />} />
        <Route path="messages" element={<StudentMessages />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={`/${user.role}`} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Bro-serRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <ToastContainer />
        </AuthProvider>
      </ThemeProvider>
    </Bro-serRouter>
  );
}
