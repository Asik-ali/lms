import nodemailer from 'nodemailer';
import { createServiceClient, requireAdmin, setCors, getBearerToken } from './_auth.mjs';

const backupTables = [
  'profiles', 'sales_plans', 'sales_plan_items', 'purchase_orders', 'purchases',
  'courses', 'course_pdfs', 'course_lessons',
  'assignments', 'assignment_submissions', 'quizzes', 'questions', 'attendance',
  'announcements', 'enrollments', 'notifications', 'live_classes',
  'smtp_settings', 'tickets', 'ticket_replies', 'calendar_events',
  'test_series', 'test_categories', 'tests', 'test_attempts', 'test_responses',
  'question_reports',
];

async function fetchBackup(supabase) {
  const entries = [];
  for (const table of backupTables) {
    try {
      const rows = [];
      const pageSize = 500;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase.from(table).select('*').order('id').range(offset, offset + pageSize - 1);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < pageSize) break;
      }
      entries.push([table, rows]);
    } catch (err) {
      entries.push([table, { __error: err.message }]);
    }
  }
  return {
    version: 1,
    type: 'lms-backup',
    createdAt: new Date().toISOString(),
    tables: Object.fromEntries(entries),
  };
}

async function sendBackupEmail(supabase, recipient, backup) {
  const { data: saved } = await supabase.from('smtp_settings').select('*').limit(1).maybeSingle();
  const smtp = saved;
  if (!smtp || !smtp.username || !smtp.password) {
    throw new Error('SMTP not configured. Go to Settings > SMTP to set it up.');
  }

  const port = Number(smtp.port);
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port,
    secure: port === 465,
    auth: { user: smtp.username, pass: smtp.password },
  });

  const counts = Object.entries(backup.tables)
    .map(([table, rows]) => {
      const n = Array.isArray(rows) ? rows.length : rows.__error || 0;
      const status = Array.isArray(rows) ? `${n}` : `error: ${rows.__error}`;
      return `${table}: ${status}`;
    })
    .join('\n');

  const date = new Date(backup.createdAt).toLocaleString();

  const html = `<h2>LMS Automatic Backup</h2>
<p>Backup created at: <strong>${date}</strong></p>
<p>Record counts:</p>
<pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:12px">${counts}</pre>
<p>The full backup JSON is attached to this email. Download and keep it safe. Use <strong>Settings &gt; Backup &amp; Restore</strong> &gt; <em>Paste Backup</em> to restore.</p>`;

  await transporter.sendMail({
    from: `"${smtp.sender_name || 'LMS Platform'}" <${smtp.username}>`,
    to: recipient,
    subject: `LMS Backup - ${backup.createdAt.slice(0, 10)}`,
    html,
    attachments: [
      {
        filename: `lms-backup-${backup.createdAt.slice(0, 10)}.json`,
        content: JSON.stringify(backup, null, 2),
        contentType: 'application/json',
      },
    ],
  });
}

async function recordCounts(backup) {
  const counts = {};
  for (const [table, rows] of Object.entries(backup.tables)) {
    counts[table] = Array.isArray(rows) ? rows.length : -1;
  }
  return counts;
}

async function logBackup(supabase, { type, emailedTo, counts, status, error }) {
  const { error: insertError } = await supabase.from('backup_log').insert({
    type,
    emailed_to: emailedTo,
    record_counts: counts,
    status,
    error: error || null,
  });
  if (insertError) console.error('backup_log insert warning:', insertError.message);
}

async function hasRunToday(supabase) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { data } = await supabase
    .from('backup_log')
    .select('id')
    .eq('type', 'cron')
    .eq('status', 'success')
    .gte('created_at', start.toISOString())
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  let supabase;

  try {
    supabase = createServiceClient();
    if (req.method === 'POST') {
      // Require an authenticated admin (block anonymous data-exfiltration abuse)
      const allowed = await requireAdmin(req, res, supabase);
      if (!allowed) return;

      const { recipient } = req.body || {};
      if (!recipient) {
        return res.status(400).json({ error: 'Missing recipient email' });
      }
      const backup = await fetchBackup(supabase);
      await sendBackupEmail(supabase, recipient, backup);
      await logBackup(supabase, {
        type: 'manual',
        emailedTo: [recipient],
        counts: await recordCounts(backup),
        status: 'success',
      });
      return res.status(200).json({ success: true, createdAt: backup.createdAt });
    }

    if (req.method === 'GET') {
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret || getBearerToken(req) !== cronSecret) {
        if (!await requireAdmin(req, res, supabase)) return;
      }
      // Only email once per day automatically to avoid duplicate backup emails.
      if (await hasRunToday(supabase)) {
        return res.status(200).json({ success: true, cron: true, skipped: true });
      }

      const backup = await fetchBackup(supabase);
      const { data: adminProfiles } = await supabase.from('profiles').select('email').eq('role', 'admin');
      const admins = (adminProfiles || []).map(p => p.email).filter(Boolean);

      let emailed = [];
      if (admins.length) {
        for (const email of admins) {
          try {
            await sendBackupEmail(supabase, email, backup);
            emailed.push(email);
          } catch {
            // continue emailing other admins
          }
        }
      }

      const counts = await recordCounts(backup);
      await logBackup(supabase, {
        type: 'cron',
        emailedTo: emailed,
        counts,
        status: emailed.length ? 'success' : 'failed',
        error: emailed.length ? null : 'No admins could be emailed',
      });

      return res.status(200).json({
        success: true,
        cron: true,
        createdAt: backup.createdAt,
        emailed,
        counts,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (supabase) await logBackup(supabase, {
      type: 'cron',
      emailedTo: [],
      counts: {},
      status: 'failed',
      error: err.message,
    }).catch(() => {});
    return res.status(500).json({ error: err.message || 'Backup failed' });
  }
}
