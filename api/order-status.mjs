import { reconcileOrder } from './_order-lifecycle.mjs';
import { createServiceClient, getAuthedUser, setCors } from './_auth.mjs';
import referralsHandler from './_referrals-handler.mjs';

export default async function handler(req, res) {
  if (['referrals', 'referral-balance'].includes(req.query?.operation)) return referralsHandler(req, res);
  if (setCors(req, res)) return;

  const closing = ['cancel', 'failed'].includes(req.query?.operation);
  if (req.method !== (closing ? 'POST' : 'GET')) return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');

  try {
    const supabase = createServiceClient();
    const profile = await getAuthedUser(req, supabase);
    if (!profile) return res.status(401).json({ error: 'Not authorized' });

    const orderId = closing ? req.body?.orderId : req.query?.orderId;
    if (closing && (typeof orderId !== 'string' || !orderId.trim())) return res.status(400).json({ error: 'Order ID is required.' });
    if (req.query?.operation === 'invoice' && !orderId) return res.status(400).json({ error: 'Order ID is required.' });

    if (orderId) {
      const { data: order, error } = await supabase
        .from('purchase_orders')
        .select('id, order_id, plan_id, student_id, amount, status, created_at, cart_plans, credit_applied, credit_released, close_reason')
        .eq('order_id', orderId)
        .eq('student_id', profile.id)
        .maybeSingle();
      if (error) throw error;
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (req.query?.operation === 'invoice') {
        if (order.status !== 'PAID') return res.status(409).json({ error: 'Invoices are available only after payment confirmation.' });
        const { data: purchase, error: purchaseError } = await supabase.from('purchases')
          .select('order_id, amount, granted, created_at').eq('order_id', orderId)
          .eq('student_id', profile.id).maybeSingle();
        if (purchaseError) throw purchaseError;
        if (!purchase?.granted || Number(purchase.amount) !== Number(order.amount)) {
          return res.status(409).json({ error: 'Your purchase is still being finalized. Please try again shortly.' });
        }
        return res.status(200).json({
          number: `INV-${order.order_id}`, orderId: order.order_id, date: purchase.created_at,
          seller: 'EXAMSTICK', customer: { name: profile.name, email: profile.email },
          amount: Number(order.amount), currency: 'INR', status: 'PAID',
          creditApplied: Number(order.credit_applied || 0),
          items: order.cart_plans || [{ name: 'Course / test purchase', price: Number(order.amount) }],
        });
      }
      const updated = await reconcileOrder(supabase, order, {
        reason: closing ? (req.query.operation === 'failed' ? 'FAILED' : 'CANCELLED') : undefined,
        inspectPayments: !closing,
      });
      return res.status(200).json(updated);
    }

    // Return the student's recent orders + completed purchases
    const { data: orders, error: oErr } = await supabase
      .from('purchase_orders')
      .select('id, order_id, plan_id, student_id, amount, status, created_at, cart_plans, credit_applied, credit_released, close_reason')
      .eq('student_id', profile.id)
      .gte('created_at', '2026-09-30T18:30:00.000Z')
      .order('created_at', { ascending: false });
    if (oErr) throw oErr;
    // Refresh stale history, including pre-existing failed/cancelled orders.
    const unfinished = (orders || []).filter(order => order.status !== 'PAID' && !order.credit_released).slice(0, 10);
    const refreshed = await Promise.allSettled(unfinished.map(order => reconcileOrder(supabase, order, { inspectPayments: true })));
    const updates = new Map(refreshed.filter(result => result.status === 'fulfilled').map(result => [result.value.order_id, result.value]));

    const { data: purchases, error: pErr } = await supabase
      .from('purchases')
      .select('id, order_id, plan_id, amount, created_at')
      .eq('student_id', profile.id)
      .gte('created_at', '2026-09-30T18:30:00.000Z')
      .order('created_at', { ascending: false });
    if (pErr) throw pErr;

    return res.status(200).json({ orders: (orders || []).map(order => updates.get(order.order_id) || order), purchases: purchases || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load order status' });
  }
}
