/**
 * Seed script for Supabase.
 * Run: node src/supabase/seed.js
 * Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function seed() {
  const { data: existingCategories } = await supabase.from('categories').select('id').limit(1);
  if (existingCategories?.length) {
    console.log('Data already seeded, skipping.');
    process.exit(0);
  }

  const categories = ['Frontend', 'Backend', 'Data Science', 'AI/ML', 'Design', 'DevOps', 'Security', 'Infrastructure'];
  await supabase.from('categories').insert(categories.map(name => ({ name })));
  console.log('  categories seeded');

  const users = [
    { email: 'admin@lms.app', password: 'admin123', username: 'admin', name: 'Admin User', role: 'admin' },
    { email: 'alice.johnson@lms.app', password: 'student123', username: 'alice.johnson', name: 'Alice Johnson', role: 'student', course: 'React Fundamentals', enrolled: '2026-01-15', progress: 85 },
    { email: 'bob.smith@lms.app', password: 'student123', username: 'bob.smith', name: 'Bob Smith', role: 'student', course: 'Node.js Advanced', enrolled: '2026-02-20', progress: 62 },
    { email: 'eve.davis@lms.app', password: 'student123', username: 'eve.davis', name: 'Eve Davis', role: 'student', course: 'Machine Learning', enrolled: '2026-05-12', progress: 78 },
  ];

  for (const u of users) {
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { username: u.username, name: u.name, role: u.role },
    });
    if (authErr) { console.error(`  Failed to create ${u.username}:`, authErr.message); continue; }

    const { error: profileErr } = await supabase.from('profiles').insert({
      id: authData.user.id,
      username: u.username,
      name: u.name,
      email: u.email,
      role: u.role,
      course: u.course || null,
      enrolled: u.enrolled || null,
      progress: u.progress || 0,
    });
    if (profileErr) console.error(`  Profile error for ${u.username}:`, profileErr.message);
  }
  console.log('  users seeded');

  const courses = [
    { title: 'React Fundamentals', category: 'Frontend', students: 120, lessons: 24, duration: '8 weeks', status: 'Published' },
    { title: 'Node.js Advanced', category: 'Backend', students: 85, lessons: 18, duration: '6 weeks', status: 'Published' },
    { title: 'Python for Data Science', category: 'Data Science', students: 95, lessons: 20, duration: '10 weeks', status: 'Published' },
  ];
  await supabase.from('courses').insert(courses);
  console.log('  courses seeded');

  const { data: seededCourses } = await supabase.from('courses').select('id, title');
  const pdfs = [
    { course_title: 'React Fundamentals', title: 'React Quick Reference', pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { course_title: 'React Fundamentals', title: 'JSX Cheatsheet', pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { course_title: 'Node.js Advanced', title: 'Node.js API Guide', pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { course_title: 'Python for Data Science', title: 'NumPy Reference', pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  ];
  const pdfRows = pdfs
    .filter(p => seededCourses?.find(c => c.title === p.course_title))
    .map(p => ({ course_id: seededCourses.find(c => c.title === p.course_title).id, title: p.title, pdf_url: p.pdf_url }));
  if (pdfRows.length) await supabase.from('course_pdfs').insert(pdfRows);
  console.log('  course pdfs seeded');

  await supabase.from('assignments').insert({ title: 'React Component Project', course: 'React Fundamentals', due_date: '2026-08-05', submissions: 32, total: 45, status: 'Active' });
  await supabase.from('quizzes').insert({ title: 'React Basics Quiz', course: 'React Fundamentals', questions: 15, total_marks: 100, duration: '30 min', status: 'Published' });
  await supabase.from('questions').insert({ question: 'https://drive.google.com/file/d/1-sample-react/view', type: 'Multiple Choice', category: 'Frontend', difficulty: 'Easy' });
  await supabase.from('questions').insert({ question: 'https://drive.google.com/file/d/2-sample-closures/view', type: 'Essay', category: 'Frontend', difficulty: 'Medium' });
  await supabase.from('attendance').insert({ name: 'Alice Johnson', course: 'React Fundamentals', present: 18, total: 20, percentage: 90 });
  await supabase.from('attendance').insert({ name: 'Bob Smith', course: 'Node.js Advanced', present: 14, total: 18, percentage: 78 });
  await supabase.from('announcements').insert({ title: 'Holiday Notice - August 15', content: 'All classes will remain closed on August 15th.', target: 'All', created: '2026-07-28', status: 'Published' });
  await supabase.from('enrollments').insert({ name: 'John Doe', email: 'john@example.com', course: 'React Fundamentals', requested: '2026-07-28', status: 'Pending' });
  await supabase.from('notifications').insert({ message: 'Welcome to the LMS!', time: '1 day ago', type: 'info' });

  console.log('Seed complete!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
