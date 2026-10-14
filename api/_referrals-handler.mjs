import crypto from 'node:crypto';
import { createServiceClient, getAuthedUser, setCors } from './_auth.mjs';
import { getCashfreeOrder } from './_cashfree.mjs';
import { isVerifiedPaidOrder, fulfillPaidOrder } from './_fulfillment.mjs';

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
    if (!admin) {
      // Reconcile unfinished credit checkouts. Payment-attempt failures alone do
      // not release credit, since the same Cashfree order may still be retried.
      const pending = await supabase.from('purchase_orders')
        .select('id, order_id, student_id, amount').eq('student_id', user.id)
        .gt('credit_applied', 0).eq('credit_released', false).neq('status', 'PAID')
        .order('created_at').limit(5);
      if (pending.error) throw pending.error;
      for (const order of pending.data || []) {
        let remote;
        try { remote = await getCashfreeOrder(order.order_id); }
        catch { continue; } // Unknown provider state must retain the reservation.
        if (isVerifiedPaidOrder(remote, order)) await fulfillPaidOrder(supabase, order.order_id);
        else if (['EXPIRED', 'TERMINATED'].includes(remote.order_status)) {
          const released = await supabase.from('purchase_orders')
            .update({ status: 'CANCELLED', credit_released: true }).eq('id', order.id).neq('status', 'PAID');
          if (released.error) throw released.error;
        }
      }
      if (req.query?.operation === 'referral-balance') {
        const balance = await supabase.rpc('referral_credit_balance', { buyer_id: user.id });
        if (balance.error) throw balance.error;
        return res.status(200).json({ availableCredit: Number(balance.data) });
      }
    }
    let code = null;
    if (!admin) {
      const { error } = await supabase.from('referral_codes').upsert({
        student_id: user.id, code: crypto.randomBytes(6).toString('hex').toUpperCase(),
      }, { onConflict: 'student_id', ignoreDuplicates: true });
      if (error) throw error;
      const result = await supabase.from('referral_codes').select('code').eq('student_id', user.id).single();
      if (result.error) throw result.error;
      code = result.data.code;
    }
    const page = Math.max(0, Math.floor(Number(req.query?.page) || 0));
    let query = supabase.from('referrals').select(
      'id, created_at, qualified_at, qualifying_order_id, reward_amount, reward_status, referrer:profiles!referrals_referrer_id_fkey(name), referred:profiles!referrals_referred_id_fkey(name)',
      { count: 'exact' },
    ).order('created_at', { ascending: false }).order('id').range(page * 25, page * 25 + 24);
    if (!admin) query = query.eq('referrer_id', user.id);
    const result = await query;
    if (result.error) throw result.error;
    const settings = await supabase.from('referral_settings').select('reward_amount').eq('id', 1).single();
    if (settings.error) throw settings.error;
    let availableCredit = 0;
    if (!admin) {
      const balance = await supabase.rpc('referral_credit_balance', { buyer_id: user.id });
      if (balance.error) throw balance.error;
      availableCredit = Number(balance.data);
    }
    return res.status(200).json({ code, referrals: result.data, count: result.count, page, rewardAmount: Number(settings.data.reward_amount), availableCredit });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unable to load referrals.' });
  }
}
