import { createClient } from '@supabase/supabase-js';
import { setCors } from './_auth.mjs';

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const { data: signup, error: fetchErr } = await supabase
      .from('pending_signups')
      .select('*')
      .eq('email', cleanEmail)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (fetchErr) throw fetchErr;

    if (!signup) {
      return res.status(400).json({ error: 'No pending signup found for this email.' });
    }

    if (new Date(signup.expires_at).getTime() < Date.now()) {
      await supabase.from('pending_signups').delete().eq('id', signup.id);
      return res.status(400).json({ error: 'This verification code has expired. Please sign up again.' });
    }

    if (signup.otp !== cleanOtp) {
      return res.status(400).json({ error: 'Incorrect verification code. Please try again.' });
    }

    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: signup.password,
      email_confirm: true,
      user_metadata: {
        username: signup.username,
        name: signup.name,
        profile_email: cleanEmail,
        role: 'student',
      },
    });
    if (authErr) throw authErr;
    if (!authUser?.user) throw new Error('Account could not be created.');

    const userId = authUser.user.id;

    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: userId,
      username: signup.username,
      name: signup.name,
      email: cleanEmail,
      role: 'student',
      enrolled: new Date().toISOString().split('T')[0],
    }).select().single();
    if (profileErr) {
      console.error('Profile insert warning:', profileErr);
    }

    await supabase.from('pending_signups').update({ verified: true }).eq('id', signup.id);
    await supabase.from('pending_signups').delete().eq('id', signup.id);

    return res.status(200).json({
      success: true,
      email: cleanEmail,
      password: signup.password,
      userId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to verify' });
  }
}
