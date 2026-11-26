export const restoreTables = [
  'profiles', 'courses', 'course_pdfs', 'course_lessons', 'test_series',
  'test_categories', 'tests', 'assignments', 'assignment_submissions', 'quizzes',
  'questions', 'attendance', 'announcements', 'enrollments', 'notifications',
  'live_classes', 'smtp_settings', 'tickets', 'ticket_replies', 'calendar_events',
  'test_attempts', 'test_responses', 'question_reports', 'sales_plans',
  'sales_plan_items', 'purchase_orders', 'purchases', 'referral_settings',
  'referral_codes', 'referrals',
];
const exportOnlyTables = ['audit_logs', 'push_subscriptions', 'pending_signups', 'backup_log'];

export function validateBackup(backup) {
  if (backup?.version !== 1 || (backup.type && backup.type !== 'lms-backup') ||
      !backup.tables || typeof backup.tables !== 'object' || Array.isArray(backup.tables)) {
    throw new Error('This is not a valid LMS backup.');
  }
  const entries = Object.entries(backup.tables);
  if (!entries.length) throw new Error('The backup contains no tables.');
  for (const [table, rows] of entries) {
    if (![...restoreTables, ...exportOnlyTables].includes(table)) throw new Error(`Unsupported backup table: ${table}`);
    if (!Array.isArray(rows)) throw new Error(`The backup is incomplete: ${table} was not exported successfully.`);
    const key = table === 'referral_codes' ? 'student_id' : 'id';
    if (restoreTables.includes(table) && rows.some(row => !row || typeof row !== 'object' || Array.isArray(row) || row[key] == null)) {
      throw new Error(`Invalid records in ${table}: original IDs are required.`);
    }
  }
  return entries.map(([table, rows]) => ({ table, count: rows.length }));
}
