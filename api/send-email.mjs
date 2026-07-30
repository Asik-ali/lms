import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
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
    const { recipient, subject, message, smtpConfig } = req.body;

    let smtp = smtpConfig;
    if (!smtp || !smtp.username || !smtp.password) {
      const { data: saved } = await supabase.from('smtp_settings').select('*').limit(1).maybeSingle();
      smtp = saved;
    }

    if (!smtp || !smtp.username || !smtp.password) {
      return res.status(400).json({ error: 'SMTP not configured. Go to Settings > SMTP to set it up.' });
    }

    if (!recipient || !subject || !message) {
      return res.status(400).json({ error: 'Missing recipient, subject, or message' });
    }

    const port = Number(smtp.port);
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port,
      secure: port === 465,
      auth: { user: smtp.username, pass: smtp.password },
    });

    const info = await transporter.sendMail({
      from: `"${smtp.sender_name || 'LMS Platform'}" <${smtp.username}>`,
      to: recipient,
      subject,
      text: message,
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to send email' });
  }
}
