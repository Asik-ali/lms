import { createServiceClient } from './_auth.mjs';
import { PAYMENT_ORDER_CLEANUP_MINUTES } from './_cashfree.mjs';
import { reconcileOrder } from './_order-lifecycle.mjs';

// Close abandoned orders after the local retry window; the Cashfree request
// deliberately omits order_expiry_time and the provider handles its own default.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const expected = process.env.CRON_SECRET;
  const authorization = req.headers?.authorization || '';
  if (!expected || authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  try {
    const cutoff = new Date(Date.now() - PAYMENT_ORDER_CLEANUP_MINUTES * 60 * 1000).toISOString();
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

    const results = await Promise.allSettled((orders || []).map(order => reconcileOrder(supabase, order, { reason: 'CANCELLED', inspectPayments: true })));
    const failed = results.filter(result => result.status === 'rejected').length;
    return res.status(failed ? 207 : 200).json({ processed: results.length, failed });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to expire payment orders' });
  }
}
