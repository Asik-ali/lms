import crypto from 'crypto';
import nodemailer from 'nodemailer';
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
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const { data: existing, error: existingErr } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', cleanEmail)
      .maybeSingle();
    if (existingErr) throw existingErr;
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const base = name.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    const suffix = crypto.randomBytes(3).toString('hex');
    const username = `${base}.${suffix}`;

    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertErr } = await supabase
      .from('pending_signups')
      .insert({ email: cleanEmail, name: name.trim(), password, username, otp, expires_at: expiresAt });
    if (insertErr) throw insertErr;

    const smtp = await loadSmtp(supabase);
    if (!smtp || !smtp.username || !smtp.password) {
      return res.status(400).json({ error: 'SMTP not configured. Contact the administrator.' });
    }

    const port = Number(smtp.port);
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port,
      secure: port === 465,
      auth: { user: smtp.username, pass: smtp.password },
    });

    await transporter.sendMail({
      from: `"${smtp.sender_name || 'LMS Platform'}" <${smtp.username}>`,
      to: cleanEmail,
      subject: 'Your LMS verification code',
      text: `Hi ${name.trim()},\n\nYour verification code is: ${otp}\n\nEnter this code on the signup page to verify your email. This code expires in 10 minutes.\n\nThank you,\n${smtp.sender_name || 'LMS Platform'}`,
    });

    return res.status(200).json({ success: true, email: cleanEmail });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to send OTP' });
  }
}

async function loadSmtp(supabase) {
  const { data } = await supabase.from('smtp_settings').select('*').limit(1).maybeSingle();
  return data;
}
