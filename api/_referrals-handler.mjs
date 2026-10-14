import crypto from 'node:crypto';
import { createServiceClient, getAuthedUser, setCors } from './_auth.mjs';
import { reconcileOrder } from './_order-lifecycle.mjs';

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    const supabase = createServiceClient();
    const user = await getAuthedUser(req, supabase);
    if (!user) return res.status(401).json({ error: 'Not authorized' });
    const admin = user.role === 'admin';
    if (!admin && user.role !== 'student') return res.status(403).json({ error: 'Not authorized' });
    if (!admin && req.query?.operation === 'referral-balance') {
      // Retry requested cancellations and restore only that order's used credit.
      const pending = await supabase.from('purchase_orders')
        .select('id, order_id, student_id, amount, status, credit_released, close_reason').eq('student_id', user.id)
        .gt('credit_applied', 0).eq('credit_released', false).neq('status', 'PAID')
        .order('created_at').limit(5);
      if (pending.error) throw pending.error;
      await Promise.allSettled((pending.data || []).map(order => reconcileOrder(supabase, order, { inspectPayments: true })));
      if (req.query?.operation === 'referral-balance') {
        const balance = await supabase.rpc('referral_credit_balance', { buyer_id: user.id });
        if (balance.error) throw balance.error;
        return res.status(200).json({ availableCredit: Number(balance.data) });
      }
    }
    async function getCode() {
      if (admin) return null;
      const existing = await supabase.from('referral_codes').select('code').eq('student_id', user.id).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) return existing.data.code;
      const inserted = await supabase.from('referral_codes').upsert({
        student_id: user.id, code: crypto.randomBytes(6).toString('hex').toUpperCase(),
      }, { onConflict: 'student_id', ignoreDuplicates: true });
      if (inserted.error) throw inserted.error;
      const result = await supabase.from('referral_codes').select('code').eq('student_id', user.id).single();
      if (result.error) throw result.error;
      return result.data.code;
    }
    const page = Math.max(0, Math.floor(Number(req.query?.page) || 0));
    let query = supabase.from('referrals').select(
      'id, created_at, qualified_at, qualifying_order_id, reward_amount, reward_status, referrer:profiles!referrals_referrer_id_fkey(name), referred:profiles!referrals_referred_id_fkey(name)',
      { count: 'exact' },
    ).order('created_at', { ascending: false }).order('id').range(page * 25, page * 25 + 24);
    if (!admin) query = query.eq('referrer_id', user.id);
    // The referral screen never waits for external Cashfree requests. Checkout
    // balance/history still reconcile payments through their existing endpoints.
    const [result, settings, balance, code] = await Promise.all([
      query,
      supabase.from('referral_settings').select('reward_amount').eq('id', 1).single(),
      admin ? Promise.resolve({ data: 0 }) : supabase.rpc('referral_credit_balance', { buyer_id: user.id }),
      getCode(),
    ]);
    if (result.error) throw result.error;
    if (settings.error) throw settings.error;
    if (balance.error) throw balance.error;
    const availableCredit = Number(balance.data);
    return res.status(200).json({ code, referrals: result.data, count: result.count, page, rewardAmount: Number(settings.data.reward_amount), availableCredit });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unable to load referrals.' });
  }
}
