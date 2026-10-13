import { getCashfreeOrder } from './_cashfree.mjs';
import { fulfillPaidOrder, isVerifiedPaidOrder } from './_fulfillment.mjs';
import { createServiceClient, getAuthedUser, setCors } from './_auth.mjs';

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = createServiceClient();
    const profile = await getAuthedUser(req, supabase);
    if (!profile) return res.status(401).json({ error: 'Not authorized' });

    const { orderId } = req.query || {};
    if (req.query?.operation === 'invoice' && !orderId) return res.status(400).json({ error: 'Order ID is required.' });

    if (orderId) {
      const { data: order, error } = await supabase
        .from('purchase_orders')
        .select('id, order_id, plan_id, student_id, amount, status, created_at, cart_plans')
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
          items: order.cart_plans || [{ name: 'Course / test purchase', price: Number(order.amount) }],
        });
      }
      if (order.status !== 'PAID') {
        const remote = await getCashfreeOrder(order.order_id);
        if (isVerifiedPaidOrder(remote, order)) {
          await fulfillPaidOrder(supabase, order.order_id);
          order.status = 'PAID';
        }
      }
      return res.status(200).json(order);
    }

    // Return the student's recent orders + completed purchases
    const { data: orders, error: oErr } = await supabase
      .from('purchase_orders')
      .select('id, order_id, plan_id, amount, status, created_at, cart_plans')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });
    if (oErr) throw oErr;

    const { data: purchases, error: pErr } = await supabase
      .from('purchases')
      .select('id, order_id, plan_id, amount, created_at')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });
    if (pErr) throw pErr;

    return res.status(200).json({ orders: orders || [], purchases: purchases || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load order status' });
  }
}
