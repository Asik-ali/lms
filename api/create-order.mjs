import { randomUUID } from 'node:crypto';
import { createServiceClient, getAuthedUser, setCors } from './_auth.mjs';
import { createCashfreeOrder, CASHFREE_ORDER_PREFIX, PAYMENT_ORDER_CLEANUP_MINUTES, getCashfreeMode } from './_cashfree.mjs';
import { reconcileOrder } from './_order-lifecycle.mjs';

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
    const customerPhone = String(req.body?.customerPhone || '').replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(customerPhone)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number for Cashfree checkout.' });
    }

    // Reconcile any older checkout that reserved the same content before
    // allowing another payment attempt. Never create a second payable order
    // while Cashfree still reports an active/pending transaction.
    const { data: requestedItems, error: itemsError } = await supabase
      .from('sales_plan_items')
      .select('item_type, item_id')
      .in('plan_id', planIds);
    if (itemsError) throw itemsError;
    const requestedContent = new Set((requestedItems || []).map(item => `${item.item_type}:${item.item_id}`));

    const { data: existingOrders, error: existingError } = await supabase
      .from('purchase_orders')
      .select('id, order_id, plan_id, student_id, amount, status, created_at, cart_plans, access_items, credit_applied, credit_released, close_reason')
      .eq('student_id', profile.id)
      .neq('status', 'PAID')
      .eq('credit_released', false)
      .order('created_at', { ascending: false })
      .limit(50);
    if (existingError) throw existingError;

    const legacyPlanIds = [...new Set((existingOrders || [])
      .filter(order => !Array.isArray(order.access_items) && order.plan_id)
      .map(order => order.plan_id))];
    const itemsByPlan = new Map();
    if (legacyPlanIds.length) {
      const { data: legacyItems, error: legacyItemsError } = await supabase
        .from('sales_plan_items')
        .select('plan_id, item_type, item_id')
        .in('plan_id', legacyPlanIds);
      if (legacyItemsError) throw legacyItemsError;
      for (const item of legacyItems || []) {
        if (!itemsByPlan.has(item.plan_id)) itemsByPlan.set(item.plan_id, []);
        itemsByPlan.get(item.plan_id).push(item);
      }
    }

    const overlappingOrders = (existingOrders || []).filter(order => {
      const content = Array.isArray(order.access_items)
        ? order.access_items
        : itemsByPlan.get(order.plan_id) || [];
      return content.some(item => requestedContent.has(`${item.item_type}:${item.item_id}`));
    });
    for (const order of overlappingOrders) {
      await reconcileOrder(supabase, order, { reason: 'CANCELLED', inspectPayments: true });
    }

    if (overlappingOrders.length) {
      const orderIds = new Set(overlappingOrders.map(order => order.order_id));
      const { data: stillOpen, error: openError } = await supabase
        .from('purchase_orders')
        .select('order_id, status, credit_released')
        .in('order_id', [...orderIds]);
      if (openError) throw openError;
      // Failed and manually cancelled attempts are historical records, not
      // active payment reservations. Only a genuinely open checkout blocks a
      // fresh order for the same course/test.
      const activeOrder = (stillOpen || []).find(order =>
        !['PAID', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(order.status) && !order.credit_released,
      );
      if (activeOrder) {
        return res.status(409).json({
          error: `Payment for this content is still being processed (order ${activeOrder.order_id}). Check its status before trying again.`,
          orderId: activeOrder.order_id,
          status: activeOrder.status,
        });
      }
    }

    const orderId = `${CASHFREE_ORDER_PREFIX}-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const useCredit = req.body?.useCredit === true;
    const { data: storedOrder, error: orderErr } = await supabase.rpc(useCredit ? 'create_purchase_cart_with_credit' : 'create_purchase_cart', {
      cashfree_order_id: orderId, buyer_id: profile.id, selected_plan_ids: planIds,
      ...(useCredit ? { use_credit: true } : {}),
    });
    if (orderErr) return res.status(400).json({ error: orderErr.message || 'Unable to create cart order' });
    const planName = storedOrder.plan_name;

    let cashfreeOrder;
    try { cashfreeOrder = await createCashfreeOrder({
      orderId,
      amount: storedOrder.amount,
      customer: { ...profile, phone: customerPhone },
      planName,
      origin: getOrigin(req),
    }); } catch (err) {
      // A confirmed validation rejection never created a payable provider order.
      // Keep reservations on timeouts/unknown results to avoid double spending.
      if (err.status === 400) {
        const { error } = await supabase.from('purchase_orders').update({ status: 'FAILED', close_reason: 'FAILED', credit_released: true })
          .eq('id', storedOrder.id).neq('status', 'PAID');
        if (error) throw error;
      }
      throw err;
    }

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
      credit_applied: storedOrder.credit_applied || 0,
      plan_name: planName,
      mode: getCashfreeMode(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create order' });
  }
}
