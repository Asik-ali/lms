import { createServiceClient, getAuthedUser, setCors } from './_auth.mjs';
import { createCashfreeOrder, CASHFREE_ORDER_PREFIX } from './_cashfree.mjs';

function getOrigin(req) {
  const host = req.headers?.['x-forwarded-host'] || req.headers?.host || '';
  const proto = (req.headers?.['x-forwarded-proto'] || '').split(',')[0].trim() || 'https';
  if (!host) return process.env.VITE_SITE_URL || '';
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServiceClient();

  try {
    const profile = await getAuthedUser(req, supabase);
    if (!profile || profile.role !== 'student') {
      return res.status(401).json({ error: 'Please login as a student to purchase.' });
    }

    const { planId } = req.body || {};
    if (!planId) return res.status(400).json({ error: 'Plan id is required.' });

    const { data: plan, error: planErr } = await supabase
      .from('sales_plans')
      .select('id, name, description, price, status')
      .eq('id', planId)
      .eq('status', 'active')
      .maybeSingle();
    if (planErr) throw planErr;
    if (!plan) return res.status(404).json({ error: 'Plan not found or not active.' });

    const orderId = `${CASHFREE_ORDER_PREFIX}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const { data: storedOrder, error: orderErr } = await supabase
      .from('purchase_orders')
      .insert({
        order_id: orderId,
        plan_id: plan.id,
        student_id: profile.id,
        amount: plan.price,
        status: 'PENDING',
      })
      .select('id, order_id, payment_session_id, amount, status')
      .single();
    if (orderErr) throw orderErr;

    const cashfreeOrder = await createCashfreeOrder({
      orderId,
      amount: plan.price,
      customer: profile,
      planName: plan.name,
      origin: getOrigin(req),
    });

    const paymentSessionId = cashfreeOrder.payment_session_id || '';
    await supabase
      .from('purchase_orders')
      .update({ payment_session_id: paymentSessionId })
      .eq('id', storedOrder.id);

    return res.status(200).json({
      success: true,
      order_id: orderId,
      payment_session_id: paymentSessionId,
      amount: plan.price,
      plan_name: plan.name,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create order' });
  }
}
