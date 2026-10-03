import nodemailer from 'nodemailer';
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

    const { recipient, subject, message, smtpConfig } = req.body || {};

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
