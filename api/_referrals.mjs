export function normalizeReferralCode(value) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string') throw new Error('Invalid referral code.');
  const code = value.trim().toUpperCase();
  if (code && !/^[A-F0-9]{12}$/.test(code)) throw new Error('Invalid referral code.');
  return code;
}

export async function resolveReferrer(supabase, value) {
  const code = normalizeReferralCode(value);
  if (!code) return null;
  const { data, error } = await supabase.from('referral_codes')
    .select('student_id, student:profiles!referral_codes_student_id_fkey(role, status)')
    .eq('code', code).maybeSingle();
  if (error) throw error;
  if (!data || data.student?.role !== 'student' || String(data.student.status).toLowerCase() === 'suspended') {
    throw new Error('This referral code is unavailable.');
  }
  return data.student_id;
}
