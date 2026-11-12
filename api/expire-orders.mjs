import { createServiceClient } from './_auth.mjs';
import { CASHFREE_ORDER_TTL_MINUTES } from './_cashfree.mjs';
import { reconcileOrder } from './_order-lifecycle.mjs';

// Vercel Cron: reconcile orders after their 20-minute Cashfree expiry.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const expected = process.env.CRON_SECRET;
  const authorization = req.headers?.authorization || '';
  if (!expected || authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  try {
    const cutoff = new Date(Date.now() - CASHFREE_ORDER_TTL_MINUTES * 60 * 1000).toISOString();
    const supabase = createServiceClient();
    const { data: orders, error } = await supabase
      .from('purchase_orders')
      .select('id, order_id, plan_id, student_id, amount, status, created_at, cart_plans, credit_applied, credit_released, close_reason')
      .neq('status', 'PAID')
      .eq('credit_released', false)
      .lte('created_at', cutoff)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;

    const results = await Promise.allSettled((orders || []).map(order => reconcileOrder(supabase, order, { inspectPayments: true })));
    const failed = results.filter(result => result.status === 'rejected').length;
    return res.status(failed ? 207 : 200).json({ processed: results.length, failed });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to expire payment orders' });
  }
}
