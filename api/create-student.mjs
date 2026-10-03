import { createServiceClient, requireAdmin, setCors } from './_auth.mjs';

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServiceClient();
    const allowed = await requireAdmin(req, res, supabase);
    if (!allowed) return;

    const { name, email, course, enrolled } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const base = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    const suffix = Math.random().toString(36).slice(2, 6);
    const username = `${base}.${suffix}`;
    const password = 'lms' + Math.random().toString(36).slice(2, 7);
    const cleanEmail = email.trim().toLowerCase();

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        name,
        profile_email: cleanEmail,
        role: 'student',
        course: course || null,
        enrolled: enrolled || new Date().toISOString().split('T')[0],
      },
    });

    if (authErr) throw authErr;
    if (!authData?.user) throw new Error('Student account could not be created.');

    const userId = authData.user.id;

    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: userId,
      username,
      name,
      email: cleanEmail,
      role: 'student',
      course: course || null,
      enrolled: enrolled || new Date().toISOString().split('T')[0],
    }).select().single();

    if (profileErr) {
      console.error('Profile insert warning:', profileErr);
    }

    return res.status(200).json({
      success: true,
      email: cleanEmail,
      password,
      userId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create student' });
  }
}
