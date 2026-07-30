import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/Layout/DashboardLayout';
import ToastContainer from './components/common/Toast';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/Dashboard';
import StudentManagement from './pages/admin/StudentManagement';
import InstructorManagement from './pages/admin/InstructorManagement';
import CourseManagement from './pages/admin/CourseManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import Enrollment from './pages/admin/Enrollment';
import Assignments from './pages/admin/Assignments';
import ExamsQuizzes from './pages/admin/ExamsQuizzes';
import AttendancePage from './pages/admin/AttendancePage';

import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import ReportsPage from './pages/admin/ReportsPage';
import CMSPage from './pages/admin/CMSPage';
import NotificationsPage from './pages/admin/NotificationsPage';
import SettingsPage from './pages/admin/SettingsPage';
import AuditPage from './pages/admin/AuditPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCourses from './pages/student/StudentCourses';
import StudentCourseDetail from './pages/student/StudentCourseDetail';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentQuizzes from './pages/student/StudentQuizzes';
import StudentAnnouncements from './pages/student/StudentAnnouncements';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorCourses from './pages/instructor/InstructorCourses';
import InstructorStudents from './pages/instructor/InstructorStudents';
import InstructorAssignments from './pages/instructor/InstructorAssignments';
import InstructorAnalytics from './pages/instructor/InstructorAnalytics';
import ProfilePage from './pages/ProfilePage';

function RoleGuard({ role, children }) {
  const { user } = useAuth();
  if (user?.role !== role) return <Navigate to={`/${user?.role || 'admin'}`} replace />;
  return children;
}

function AppRoutes() {
  const { user, logout } = useAuth();

  if (!user) return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<RoleGuard role="admin"><DashboardLayout /></RoleGuard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="students/add" element={<StudentManagement />} />
        <Route path="students/profile" element={<StudentManagement />} />
        <Route path="students/attendance" element={<AttendancePage />} />
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
        <Route path="assignments/create" element={<Assignments />} />
        <Route path="assignments/submissions" element={<Assignments />} />
        <Route path="assignments/grade" element={<Assignments />} />
        <Route path="exams/questions" element={<ExamsQuizzes />} />
        <Route path="exams/create" element={<ExamsQuizzes />} />
        <Route path="exams/results" element={<ExamsQuizzes />} />
        <Route path="exams/leaderboard" element={<ExamsQuizzes />} />
        <Route path="attendance/students" element={<AttendancePage />} />
        <Route path="attendance/class" element={<AttendancePage />} />
        <Route path="attendance/reports" element={<AttendancePage />} />
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
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="quizzes" element={<StudentQuizzes />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="calendar" element={<StudentDashboard />} />
        <Route path="announcements" element={<StudentAnnouncements />} />
        <Route path="messages" element={<StudentDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="/instructor" element={<RoleGuard role="instructor"><DashboardLayout /></RoleGuard>}>
        <Route index element={<InstructorDashboard />} />
        <Route path="courses" element={<InstructorCourses />} />
        <Route path="students" element={<InstructorStudents />} />
        <Route path="content" element={<InstructorCourses />} />
        <Route path="assignments" element={<InstructorAssignments />} />
        <Route path="quizzes" element={<ExamsQuizzes />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="analytics" element={<InstructorAnalytics />} />
        <Route path="messages" element={<InstructorDashboard />} />
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
