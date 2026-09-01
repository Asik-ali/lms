import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const sb = createClient(url, key);

const { data: authData, error: authError } = await sb.auth.signInWithPassword({
  email: 'admin@lms.app',
  password: 'admin123',
});
console.log('signin error:', authError?.message ?? 'OK', 'user:', authData?.user?.email);

const session = authData?.session;
if (!session) process.exit(0);

async function test(name, fn) {
  try {
    const r = await fn();
    console.log(name.padEnd(30), '->', r.error ? JSON.stringify(r.error.message) : 'OK');
  } catch (e) {
    console.log(name.padEnd(30), '-> THREW', e?.message);
  }
}

await test('loadProfile', () => sb.from('profiles').select('id, username, name, email, role, course, status, enrolled, progress, test_series_access').eq('id', session.user.id).single());
await test('getStudents', () => sb.from('profiles').select('id, username, name, email, role, course, status, enrolled, progress, test_series_access', { count: 'exact' }).eq('role', 'student'));
await test('getAnnouncements', () => sb.from('announcements').select('id, title, content, target, created, status', { count: 'exact' }));
