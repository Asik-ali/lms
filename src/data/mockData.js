export const stats = {
  totalStudents: 2456,
  totalInstructors: 48,
  totalCourses: 124,
  activeClasses: 18,
  studentChange: 12,
  instructorChange: 4,
  courseChange: 8,
  classChange: -2,
};

export const recentEnrollments = [
  { id: 1, name: 'Alice Johnson', course: 'React Fundamentals', date: '2026-07-28', status: 'Completed' },
  { id: 2, name: 'Bob Smith', course: 'Node.js Advanced', date: '2026-07-27', status: 'Pending' },
  { id: 3, name: 'Carol White', course: 'Python for Data Science', date: '2026-07-26', status: 'Completed' },
  { id: 4, name: 'David Brown', course: 'UI/UX Design', date: '2026-07-25', status: 'Active' },
  { id: 5, name: 'Eve Davis', course: 'Machine Learning', date: '2026-07-24', status: 'Active' },
];

export const notifications = [
  { id: 1, message: 'New enrollment request from John Doe', time: '5 min ago', type: 'info' },
  { id: 2, message: 'Assignment submission pending review', time: '1 hr ago', type: 'warning' },
  { id: 3, message: 'Course "React Advanced" completed by 12 students', time: '3 hrs ago', type: 'success' },
  { id: 4, message: 'Server backup completed successfully', time: '5 hrs ago', type: 'success' },
  { id: 5, message: 'New instructor application received', time: '1 day ago', type: 'info' },
];

export const students = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', course: 'React Fundamentals', status: 'Active', enrolled: '2026-01-15', progress: 85 },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', course: 'Node.js Advanced', status: 'Active', enrolled: '2026-02-20', progress: 62 },
  { id: 3, name: 'Carol White', email: 'carol@example.com', course: 'Python for Data Science', status: 'Suspended', enrolled: '2026-03-10', progress: 45 },
  { id: 4, name: 'David Brown', email: 'david@example.com', course: 'UI/UX Design', status: 'Active', enrolled: '2026-04-05', progress: 91 },
  { id: 5, name: 'Eve Davis', email: 'eve@example.com', course: 'Machine Learning', status: 'Active', enrolled: '2026-05-12', progress: 78 },
  { id: 6, name: 'Frank Miller', email: 'frank@example.com', course: 'React Fundamentals', status: 'Inactive', enrolled: '2026-01-20', progress: 30 },
  { id: 7, name: 'Grace Wilson', email: 'grace@example.com', course: 'Cloud Computing', status: 'Active', enrolled: '2026-06-01', progress: 55 },
  { id: 8, name: 'Henry Taylor', email: 'henry@example.com', course: 'DevOps Essentials', status: 'Active', enrolled: '2026-04-15', progress: 70 },
];

export const instructors = [
  { id: 1, name: 'Dr. Sarah Chen', email: 'sarah@example.com', department: 'Computer Science', students: 340, courses: 5, rating: 4.8 },
  { id: 2, name: 'Prof. James Wilson', email: 'james@example.com', department: 'Data Science', students: 280, courses: 4, rating: 4.6 },
  { id: 3, name: 'Ms. Emily Rodriguez', email: 'emily@example.com', department: 'Design', students: 195, courses: 3, rating: 4.9 },
  { id: 4, name: 'Mr. Michael Kim', email: 'michael@example.com', department: 'Engineering', students: 420, courses: 6, rating: 4.7 },
  { id: 5, name: 'Dr. Lisa Thompson', email: 'lisa@example.com', department: 'Mathematics', students: 310, courses: 4, rating: 4.5 },
];

export const courses = [
  { id: 1, title: 'React Fundamentals', instructor: 'Dr. Sarah Chen', category: 'Frontend', students: 120, lessons: 24, status: 'Published', duration: '8 weeks' },
  { id: 2, title: 'Node.js Advanced', instructor: 'Prof. James Wilson', category: 'Backend', students: 85, lessons: 18, status: 'Published', duration: '6 weeks' },
  { id: 3, title: 'Python for Data Science', instructor: 'Dr. Lisa Thompson', category: 'Data Science', students: 95, lessons: 20, status: 'Published', duration: '10 weeks' },
  { id: 4, title: 'UI/UX Design', instructor: 'Ms. Emily Rodriguez', category: 'Design', students: 60, lessons: 15, status: 'Draft', duration: '6 weeks' },
  { id: 5, title: 'Machine Learning', instructor: 'Mr. Michael Kim', category: 'AI/ML', students: 110, lessons: 22, status: 'Published', duration: '12 weeks' },
  { id: 6, title: 'Cloud Computing', instructor: 'Dr. Sarah Chen', category: 'Infrastructure', students: 70, lessons: 16, status: 'Published', duration: '8 weeks' },
  { id: 7, title: 'DevOps Essentials', instructor: 'Mr. Michael Kim', category: 'DevOps', students: 55, lessons: 14, status: 'Draft', duration: '6 weeks' },
  { id: 8, title: 'Cybersecurity Basics', instructor: 'Prof. James Wilson', category: 'Security', students: 90, lessons: 19, status: 'Published', duration: '8 weeks' },
];

export const categories = [
  { id: 1, name: 'Frontend', courses: 18 },
  { id: 2, name: 'Backend', courses: 15 },
  { id: 3, name: 'Data Science', courses: 12 },
  { id: 4, name: 'AI/ML', courses: 10 },
  { id: 5, name: 'Design', courses: 8 },
  { id: 6, name: 'DevOps', courses: 7 },
  { id: 7, name: 'Security', courses: 6 },
  { id: 8, name: 'Infrastructure', courses: 5 },
];

export const liveClasses = [
  { id: 1, title: 'React Hooks Deep Dive', instructor: 'Dr. Sarah Chen', date: '2026-08-01', time: '10:00 AM', roomCode: 'ABC-123', students: 45, status: 'Upcoming' },
  { id: 2, title: 'Python Pandas Workshop', instructor: 'Dr. Lisa Thompson', date: '2026-08-02', time: '2:00 PM', roomCode: 'DEF-456', students: 38, status: 'Upcoming' },
  { id: 3, title: 'CSS Grid & Flexbox', instructor: 'Ms. Emily Rodriguez', date: '2026-07-30', time: '11:00 AM', roomCode: 'GHI-789', students: 52, status: 'Completed' },
  { id: 4, title: 'Docker Containers 101', instructor: 'Mr. Michael Kim', date: '2026-07-31', time: '3:00 PM', roomCode: 'JKL-012', students: 29, status: 'Completed' },
];

export const enrollmentRequests = [
  { id: 1, name: 'John Doe', email: 'john@example.com', course: 'React Fundamentals', requested: '2026-07-28', status: 'Pending' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', course: 'Node.js Advanced', requested: '2026-07-27', status: 'Pending' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', course: 'Python for Data Science', requested: '2026-07-26', status: 'Approved' },
  { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', course: 'UI/UX Design', requested: '2026-07-25', status: 'Rejected' },
];

export const assignments = [
  { id: 1, title: 'React Component Project', course: 'React Fundamentals', dueDate: '2026-08-05', submissions: 32, total: 45, status: 'Active' },
  { id: 2, title: 'Node.js REST API', course: 'Node.js Advanced', dueDate: '2026-08-10', submissions: 18, total: 28, status: 'Active' },
  { id: 3, title: 'Data Analysis Report', course: 'Python for Data Science', dueDate: '2026-07-25', submissions: 42, total: 42, status: 'Graded' },
  { id: 4, title: 'Wireframe Design', course: 'UI/UX Design', dueDate: '2026-08-15', submissions: 12, total: 20, status: 'Active' },
];

export const questionBank = [
  { id: 1, question: 'What is React?', type: 'Multiple Choice', category: 'Frontend', difficulty: 'Easy' },
  { id: 2, question: 'Explain closures in JavaScript', type: 'Essay', category: 'Frontend', difficulty: 'Medium' },
  { id: 3, question: 'What is a REST API?', type: 'Multiple Choice', category: 'Backend', difficulty: 'Easy' },
  { id: 4, question: 'Describe the MVC pattern', type: 'Essay', category: 'Backend', difficulty: 'Hard' },
  { id: 5, question: 'What is overfitting in ML?', type: 'Multiple Choice', category: 'AI/ML', difficulty: 'Medium' },
];

export const quizzes = [
  { id: 1, title: 'React Basics Quiz', course: 'React Fundamentals', questions: 15, totalMarks: 100, duration: '30 min', status: 'Published' },
  { id: 2, title: 'Node.js Midterm', course: 'Node.js Advanced', questions: 20, totalMarks: 100, duration: '45 min', status: 'Draft' },
  { id: 3, title: 'Python Fundamentals', course: 'Python for Data Science', questions: 10, totalMarks: 50, duration: '20 min', status: 'Published' },
];

export const leaderboard = [
  { rank: 1, name: 'Alice Johnson', score: 98, course: 'React Fundamentals', badges: 5 },
  { rank: 2, name: 'David Brown', score: 95, course: 'UI/UX Design', badges: 4 },
  { rank: 3, name: 'Eve Davis', score: 92, course: 'Machine Learning', badges: 4 },
  { rank: 4, name: 'Grace Wilson', score: 88, course: 'Cloud Computing', badges: 3 },
  { rank: 5, name: 'Henry Taylor', score: 85, course: 'DevOps Essentials', badges: 3 },
  { rank: 6, name: 'Bob Smith', score: 82, course: 'Node.js Advanced', badges: 2 },
  { rank: 7, name: 'Frank Miller', score: 78, course: 'React Fundamentals', badges: 2 },
  { rank: 8, name: 'Carol White', score: 72, course: 'Python for Data Science', badges: 1 },
];

export const attendanceRecords = [
  { id: 1, name: 'Alice Johnson', course: 'React Fundamentals', present: 18, total: 20, percentage: 90 },
  { id: 2, name: 'Bob Smith', course: 'Node.js Advanced', present: 14, total: 18, percentage: 78 },
  { id: 3, name: 'Carol White', course: 'Python for Data Science', present: 10, total: 16, percentage: 63 },
  { id: 4, name: 'David Brown', course: 'UI/UX Design', present: 15, total: 15, percentage: 100 },
  { id: 5, name: 'Eve Davis', course: 'Machine Learning', present: 16, total: 18, percentage: 89 },
];

export const certificates = [
  { id: 1, name: 'Alice Johnson', course: 'React Fundamentals', issued: '2026-07-15', type: 'Completion' },
  { id: 2, name: 'David Brown', course: 'UI/UX Design', issued: '2026-07-20', type: 'Excellence' },
  { id: 3, name: 'Eve Davis', course: 'Machine Learning', issued: '2026-07-22', type: 'Completion' },
  { id: 4, name: 'Grace Wilson', course: 'Cloud Computing', issued: '2026-07-25', type: 'Completion' },
];

export const announcements = [
  { id: 1, title: 'Holiday Notice - August 15', content: 'All classes will remain closed on August 15th.', target: 'All', created: '2026-07-28', status: 'Published' },
  { id: 2, title: 'New Course Launch', content: 'We are excited to launch our new Kubernetes course.', target: 'Students', created: '2026-07-25', status: 'Published' },
  { id: 3, title: 'Faculty Meeting', content: 'Mandatory faculty meeting on August 5th.', target: 'Instructors', created: '2026-07-20', status: 'Draft' },
];

export const cmsPages = [
  { id: 1, title: 'Homepage', status: 'Published', updated: '2026-07-28' },
  { id: 2, title: 'About Us', status: 'Published', updated: '2026-07-20' },
  { id: 3, title: 'Contact', status: 'Draft', updated: '2026-07-15' },
  { id: 4, title: 'FAQ', status: 'Published', updated: '2026-07-10' },
  { id: 5, title: 'Blog', status: 'Draft', updated: '2026-07-05' },
];

export const studentCourses = [
  { id: 1, title: 'React Fundamentals', instructor: 'Dr. Sarah Chen', progress: 75, nextLesson: 'Component Lifecycle', dueDate: '2026-08-10' },
  { id: 2, title: 'Node.js Advanced', instructor: 'Prof. James Wilson', progress: 45, nextLesson: 'Middleware Functions', dueDate: '2026-08-15' },
  { id: 3, title: 'Python for Data Science', instructor: 'Dr. Lisa Thompson', progress: 90, nextLesson: 'Final Project', dueDate: '2026-08-05' },
];

export const studentAssignments = [
  { id: 1, title: 'React Component Project', course: 'React Fundamentals', dueDate: '2026-08-05', status: 'Pending', grade: null },
  { id: 2, title: 'Data Analysis Report', course: 'Python for Data Science', dueDate: '2026-07-25', status: 'Graded', grade: 92 },
  { id: 3, title: 'Node.js REST API', course: 'Node.js Advanced', dueDate: '2026-08-10', status: 'Submitted', grade: null },
];

export const upcomingEvents = [
  { id: 1, title: 'React Hooks Deep Dive', date: '2026-08-01', time: '10:00 AM', type: 'Live Class' },
  { id: 2, title: 'Python Pandas Workshop', date: '2026-08-02', time: '2:00 PM', type: 'Live Class' },
  { id: 3, title: 'React Basics Quiz', date: '2026-08-03', time: '11:00 AM', type: 'Quiz' },
];

export const instructorPerformance = [
  { month: 'Jan', students: 120, completion: 65, rating: 4.5 },
  { month: 'Feb', students: 145, completion: 70, rating: 4.6 },
  { month: 'Mar', students: 180, completion: 68, rating: 4.7 },
  { month: 'Apr', students: 200, completion: 75, rating: 4.8 },
  { month: 'May', students: 240, completion: 72, rating: 4.6 },
  { month: 'Jun', students: 280, completion: 80, rating: 4.7 },
];

export const studentProgressData = [
  { month: 'Jan', enrolled: 100, completed: 60, dropped: 5 },
  { month: 'Feb', enrolled: 150, completed: 90, dropped: 8 },
  { month: 'Mar', enrolled: 200, completed: 130, dropped: 12 },
  { month: 'Apr', enrolled: 280, completed: 190, dropped: 15 },
  { month: 'May', enrolled: 350, completed: 240, dropped: 18 },
  { month: 'Jun', enrolled: 420, completed: 310, dropped: 22 },
];

export const revenueData = [
  { month: 'Jan', revenue: 45000, expenses: 32000 },
  { month: 'Feb', revenue: 52000, expenses: 34000 },
  { month: 'Mar', revenue: 48000, expenses: 31000 },
  { month: 'Apr', revenue: 61000, expenses: 38000 },
  { month: 'May', revenue: 75000, expenses: 42000 },
  { month: 'Jun', revenue: 82000, expenses: 45000 },
];

export const studentCredentials = [
  { username: 'alice.johnson', password: 'student123', studentId: 1 },
  { username: 'bob.smith', password: 'student123', studentId: 2 },
  { username: 'carol.white', password: 'student123', studentId: 3 },
  { username: 'david.brown', password: 'student123', studentId: 4 },
  { username: 'eve.davis', password: 'student123', studentId: 5 },
  { username: 'frank.miller', password: 'student123', studentId: 6 },
  { username: 'grace.wilson', password: 'student123', studentId: 7 },
  { username: 'henry.taylor', password: 'student123', studentId: 8 },
  { username: 'admin', password: 'admin123', studentId: null },
  { username: 'instructor', password: 'instructor123', studentId: null },
];

export const studentReports = {
  1: { attendance: 90, avgScore: 88, completedAssignments: 6, totalAssignments: 8, quizAvg: 85, rank: 3 },
  2: { attendance: 78, avgScore: 72, completedAssignments: 4, totalAssignments: 7, quizAvg: 70, rank: 8 },
  3: { attendance: 63, avgScore: 65, completedAssignments: 3, totalAssignments: 6, quizAvg: 60, rank: 12 },
  4: { attendance: 100, avgScore: 95, completedAssignments: 7, totalAssignments: 7, quizAvg: 94, rank: 1 },
  5: { attendance: 89, avgScore: 82, completedAssignments: 5, totalAssignments: 6, quizAvg: 80, rank: 5 },
  6: { attendance: 45, avgScore: 55, completedAssignments: 2, totalAssignments: 6, quizAvg: 50, rank: 15 },
  7: { attendance: 82, avgScore: 78, completedAssignments: 4, totalAssignments: 5, quizAvg: 75, rank: 7 },
  8: { attendance: 70, avgScore: 68, completedAssignments: 3, totalAssignments: 5, quizAvg: 65, rank: 10 },
};
