import { createClient } from '@supabase/supabase-js';
import dotenv from 'node:process';

const supabaseUrl = dotenv.env.VITE_SUPABASE_URL;
const serviceKey = dotenv.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const { data: profiles, error } = await supabase.from('profiles').select('id, username, email, role').eq('role', 'admin');
if (error) { console.error('profiles error:', error.message); process.exit(1); }

const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
if (authErr) { console.error('listUsers error:', authErr.message); process.exit(1); }

console.log('Admin profiles:');
for (const p of profiles) console.log(`  ${p.username} | ${p.email}`);

console.log('\nAuth users:');
for (const u of authUsers.users) console.log(`  ${u.email} | ${u.user_metadata?.username || ''} | ${u.user_metadata?.role || ''}`);