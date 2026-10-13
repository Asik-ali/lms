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

  try {
    const supabase = createServiceClient();
    const profile = await getAuthedUser(req, supabase);
    if (!profile || profile.role !== 'student') {
      return res.status(401).json({ error: 'Please login as a student to purchase.' });
    }

    const requested = req.body?.planIds || (req.body?.planId ? [req.body.planId] : []);
    if (!Array.isArray(requested) || !requested.length || requested.length > 50 ||
        requested.some(id => !Number.isSafeInteger(Number(id)) || Number(id) <= 0)) {
      return res.status(400).json({ error: 'Select between 1 and 50 valid plans.' });
    }
    const planIds = [...new Set(requested.map(Number))];
    const orderId = `${CASHFREE_ORDER_PREFIX}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const { data: storedOrder, error: orderErr } = await supabase.rpc('create_purchase_cart', {
      cashfree_order_id: orderId, buyer_id: profile.id, selected_plan_ids: planIds,
    });
    if (orderErr) return res.status(400).json({ error: orderErr.message || 'Unable to create cart order' });
    const planName = storedOrder.plan_name;

    const cashfreeOrder = await createCashfreeOrder({
      orderId,
      amount: storedOrder.amount,
      customer: profile,
      planName,
      origin: getOrigin(req),
    });

    const paymentSessionId = cashfreeOrder.payment_session_id || '';
    if (!paymentSessionId) throw new Error('Payment session was not created');
    const { error: sessionError } = await supabase
      .from('purchase_orders')
      .update({ payment_session_id: paymentSessionId })
      .eq('id', storedOrder.id);
    if (sessionError) throw sessionError;

    return res.status(200).json({
      success: true,
      order_id: orderId,
      payment_session_id: paymentSessionId,
      amount: storedOrder.amount,
      plan_name: planName,
      mode: (process.env.CASHFREE_MODE || 'production').toLowerCase(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create order' });
  }
}
