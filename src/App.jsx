import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import DashboardLayout from './components/Layout/DashboardLayout';
import ToastContainer from './components/common/Toast';
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/public/PrivacyPolicyPage'));
const DeleteAccountPage = lazy(() => import('./pages/public/DeleteAccountPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const StudentManagement = lazy(() => import('./pages/admin/StudentManagement'));
const CourseManagement = lazy(() => import('./pages/admin/CourseManagement'));
const QuestionBank = lazy(() => import('./pages/admin/ExamsQuizzes'));
const AnnouncementsPage = lazy(() => import('./pages/admin/AnnouncementsPage'));
const NotificationsPage = lazy(() => import('./pages/admin/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'));
const AdminCalendar = lazy(() => import('./pages/admin/AdminCalendar'));
const AdminLiveClasses = lazy(() => import('./pages/admin/AdminLiveClasses'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentCourses = lazy(() => import('./pages/student/StudentCourses'));
const StudentCourseDetail = lazy(() => import('./pages/student/StudentCourseDetail'));
const StudentLiveClasses = lazy(() => import('./pages/student/StudentLiveClasses'));
const StudentMessages = lazy(() => import('./pages/student/StudentMessages'));
const StudentCalendar = lazy(() => import('./pages/student/StudentCalendar'));
const StudentTestSeries = lazy(() => import('./pages/student/StudentTestSeries'));
const StudentFreeTestSeries = lazy(() => import('./pages/student/StudentFreeTestSeries'));
const StudentTestDetail = lazy(() => import('./pages/student/StudentTestDetail'));
const StudentTestTaking = lazy(() => import('./pages/student/StudentTestTaking'));
const StudentTestResult = lazy(() => import('./pages/student/StudentTestResult'));

const StudentAnnouncements = lazy(() => import('./pages/student/StudentAnnouncements'));

function RoleGuard({ role, children }) {
  const { user } = useAuth();
  const effectiveRole = user?.role === 'admin' || user?.role === 'instructor' ? 'admin' : 'student';
  if (effectiveRole !== role) return <Navigate to={`/${effectiveRole || 'admin'}`} replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const homePath = user?.role === 'admin' || user?.role === 'instructor' ? '/admin' : '/student';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-navy-200">Loading...</p>
      </div>
    </div>
  );

  if (!user) return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<Navigate to={homePath} replace />} />
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
        <Route path="settings" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<div role="status" className="min-h-dvh flex items-center justify-center bg-navy-950 text-navy-100">Loading...</div>}>
            <Routes>
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/delete-account" element={<DeleteAccountPage />} />
              <Route path="*" element={<AppRoutes />} />
            </Routes>
          </Suspense>
          <ToastContainer />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
