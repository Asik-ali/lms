import { dbGet, dbSet } from './db';

const PREFIX = 'lms_';

const seed = {
  categories: ['Frontend', 'Backend', 'Data Science', 'AI/ML', 'Design', 'DevOps', 'Security', 'Infrastructure'],
  students: [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', course: 'React Fundamentals', status: 'Active', enrolled: '2026-01-15', progress: 85 },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', course: 'Node.js Advanced', status: 'Active', enrolled: '2026-02-20', progress: 62 },
    { id: 5, name: 'Eve Davis', email: 'eve@example.com', course: 'Machine Learning', status: 'Active', enrolled: '2026-05-12', progress: 78 },
  ],
  courses: [
    { id: 1, title: 'React Fundamentals', instructor: 'Dr. Sarah Chen', category: 'Frontend', students: 120, lessons: 24, status: 'Published', duration: '8 weeks' },
    { id: 2, title: 'Node.js Advanced', instructor: 'Prof. James Wilson', category: 'Backend', students: 85, lessons: 18, status: 'Published', duration: '6 weeks' },
    { id: 3, title: 'Python for Data Science', instructor: 'Dr. Lisa Thompson', category: 'Data Science', students: 95, lessons: 20, status: 'Published', duration: '10 weeks' },
  ],
  instructors: [
    { id: 1, name: 'Dr. Sarah Chen', email: 'sarah@example.com', department: 'Computer Science', students: 340, courses: 5, rating: 4.8 },
    { id: 2, name: 'Prof. James Wilson', email: 'james@example.com', department: 'Data Science', students: 280, courses: 4, rating: 4.6 },
  ],
  assignments: [
    { id: 1, title: 'React Component Project', course: 'React Fundamentals', dueDate: '2026-08-05', submissions: 32, total: 45, status: 'Active' },
  ],
  quizzes: [
    { id: 1, title: 'React Basics Quiz', course: 'React Fundamentals', questions: 15, totalMarks: 100, duration: '30 min', status: 'Published' },
  ],
  questions: [
    { id: 1, question: 'What is React?', type: 'Multiple Choice', category: 'Frontend', difficulty: 'Easy' },
    { id: 2, question: 'Explain closures', type: 'Essay', category: 'Frontend', difficulty: 'Medium' },
  ],
  attendance: [
    { id: 1, name: 'Alice Johnson', course: 'React Fundamentals', present: 18, total: 20, percentage: 90 },
    { id: 2, name: 'Bob Smith', course: 'Node.js Advanced', present: 14, total: 18, percentage: 78 },
  ],
  announcements: [
    { id: 1, title: 'Holiday Notice - August 15', content: 'All classes will remain closed on August 15th.', target: 'All', created: '2026-07-28', status: 'Published' },
  ],
  enrollments: [
    { id: 1, name: 'John Doe', email: 'john@example.com', course: 'React Fundamentals', requested: '2026-07-28', status: 'Pending' },
  ],
  notifications: [
    { id: 1, message: 'Welcome to the LMS!', time: '1 day ago', type: 'info' },
  ],
};

async function getOrInit(key) {
  const val = await dbGet(PREFIX + key);
  if (val !== undefined) return val;
  const s = seed[key];
  if (s !== undefined) await dbSet(PREFIX + key, s);
  return s;
}

async function getNextId() {
  const id = await getOrInit('_nextId');
  const next = (id || 100) + 1;
  await dbSet(PREFIX + '_nextId', next);
  return id || 100;
}

export async function getCategories() { return (await getOrInit('categories')) || []; }
export async function addCategory(name) { const list = await getCategories(); if (!list.includes(name)) { list.push(name); await dbSet(PREFIX + 'categories', list); } }

export async function getCourses() { return (await getOrInit('courses')) || []; }
export async function addCourse(c) { const list = await getCourses(); list.push({ id: await getNextId(), ...c }); await dbSet(PREFIX + 'courses', list); }
export async function updateCourse(id, data) { const list = await getCourses(); const i = list.findIndex(x => x.id === id); if (i >= 0) { list[i] = { ...list[i], ...data }; await dbSet(PREFIX + 'courses', list); } }
export async function deleteCourse(id) { const list = await getCourses(); await dbSet(PREFIX + 'courses', list.filter(x => x.id !== id)); }

export async function getStudents() { return (await getOrInit('students')) || []; }
export async function addStudent(s) { const list = await getStudents(); list.push({ id: await getNextId(), ...s }); await dbSet(PREFIX + 'students', list); }

export async function getInstructors() { return (await getOrInit('instructors')) || []; }
export async function addInstructor(s) { const list = await getInstructors(); list.push({ id: await getNextId(), ...s }); await dbSet(PREFIX + 'instructors', list); }

export async function getAssignments() { return (await getOrInit('assignments')) || []; }
export async function addAssignment(a) { const list = await getAssignments(); list.push({ id: await getNextId(), ...a }); await dbSet(PREFIX + 'assignments', list); }
export async function deleteAssignment(id) { const list = await getAssignments(); await dbSet(PREFIX + 'assignments', list.filter(x => x.id !== id)); }

export async function getQuizzes() { return (await getOrInit('quizzes')) || []; }
export async function addQuiz(q) { const list = await getQuizzes(); list.push({ id: await getNextId(), ...q }); await dbSet(PREFIX + 'quizzes', list); }

export async function getQuestions() { return (await getOrInit('questions')) || []; }
export async function addQuestion(q) { const list = await getQuestions(); list.push({ id: await getNextId(), ...q }); await dbSet(PREFIX + 'questions', list); }

export async function getAttendance() { return (await getOrInit('attendance')) || []; }
export async function addAttendance(a) { const list = await getAttendance(); list.push({ id: await getNextId(), ...a }); await dbSet(PREFIX + 'attendance', list); }
export async function updateAttendance(id, data) { const list = await getAttendance(); const i = list.findIndex(x => x.id === id); if (i >= 0) { list[i] = { ...list[i], ...data }; await dbSet(PREFIX + 'attendance', list); } }

export async function getAnnouncements() { return (await getOrInit('announcements')) || []; }
export async function addAnnouncement(a) { const list = await getAnnouncements(); list.push({ id: await getNextId(), ...a }); await dbSet(PREFIX + 'announcements', list); }

export async function getEnrollments() { return (await getOrInit('enrollments')) || []; }
export async function addEnrollment(e) { const list = await getEnrollments(); list.push({ id: await getNextId(), ...e }); await dbSet(PREFIX + 'enrollments', list); }
export async function updateEnrollment(id, data) { const list = await getEnrollments(); const i = list.findIndex(x => x.id === id); if (i >= 0) { list[i] = { ...list[i], ...data }; await dbSet(PREFIX + 'enrollments', list); } }

export async function getNotifications() { return (await getOrInit('notifications')) || []; }
export async function addNotification(n) { const list = await getNotifications(); list.unshift({ id: await getNextId(), ...n }); await dbSet(PREFIX + 'notifications', list); }
