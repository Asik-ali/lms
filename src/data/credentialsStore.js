import { getStudents } from './dynamicStore';

const seedCredentials = [
  { username: 'alice.johnson', password: 'student123', studentId: 1 },
  { username: 'bob.smith', password: 'student123', studentId: 2 },
  { username: 'eve.davis', password: 'student123', studentId: 5 },
  { username: 'admin', password: 'admin123', studentId: null },
  { username: 'instructor', password: 'instructor123', studentId: null },
];

const STORAGE_KEY = 'lms_credentials';

function getAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return seedCredentials;
}

function saveAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function saveCredential(cred) {
  const list = getAll();
  list.push(cred);
  saveAll(list);
}

export function findCredential(username, password) {
  return getAll().find(c => c.username === username.toLowerCase() && c.password === password);
}

export async function resolveUser(cred) {
  if (cred.studentId === null) return null;
  const students = await getStudents();
  const student = students.find(s => s.id === cred.studentId);
  if (student) return student;

  const all = getAll();
  const dynamic = all.find(c => c.username === cred.username);
  if (dynamic && dynamic.name) {
    return { id: dynamic.studentId, name: dynamic.name, email: dynamic.email, course: dynamic.course, status: 'Active', enrolled: dynamic.enrolled, progress: 0 };
  }
  return null;
}
