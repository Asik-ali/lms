import { getCashfreeOrder, getCashfreePayments, terminateCashfreeOrder } from './_cashfree.mjs';
import { isVerifiedPaidOrder, fulfillPaidOrder } from './_fulfillment.mjs';

async function closeOrder(supabase, order, reason, providerClosed) {
  const { data, error } = await supabase.rpc('close_purchase_order', {
    cashfree_order_id: order.order_id, reason, provider_closed: providerClosed,
  });
  if (error) throw error;
  return data;
}

function isMissingCashfreeOrder(error) {
  return error?.status === 404 || /order.*(not found|does not exist)|reference id.*does not exist/i.test(error?.message || '');
}

async function waitForTermination(orderId) {
  // Cashfree can acknowledge a termination request before the order status is
  // updated. Check briefly so an explicit user cancellation usually returns a
  // final CANCELLED status and the student can retry right away.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const remote = await getCashfreeOrder(orderId);
    if (['EXPIRED', 'TERMINATED'].includes(remote.order_status) || remote.order_status === 'PAID') return remote;
  }
  return null;
}

export async function reconcileOrder(supabase, order, { reason, inspectPayments = false } = {}) {
  if (order.status === 'PAID' || order.credit_released) return order;
  let remote;
  try {
    remote = await getCashfreeOrder(order.order_id);
  } catch (error) {
    if (!isMissingCashfreeOrder(error)) throw error;
    return closeOrder(supabase, order, order.close_reason || reason || 'CANCELLED', true);
  }
  const paid = async () => {
    await fulfillPaidOrder(supabase, order.order_id);
    return { ...order, status: 'PAID' };
  };
  if (isVerifiedPaidOrder(remote, order)) return paid();
  reason = order.close_reason || reason || (['FAILED', 'CANCELLED'].includes(order.status) ? order.status : null);
  if (['EXPIRED', 'TERMINATED'].includes(remote.order_status)) return closeOrder(supabase, order, reason || 'CANCELLED', true);

  if (!order.close_reason && inspectPayments && remote.order_status === 'ACTIVE') {
    const payments = await getCashfreePayments(order.order_id);
    // An in-flight/successful attempt takes precedence over earlier failures.
    if (payments.some(payment => ['SUCCESS', 'PENDING'].includes(payment.payment_status))) return order;
    if (payments.length && payments.every(payment => ['FAILED', 'CANCELLED', 'USER_DROPPED', 'VOID'].includes(payment.payment_status))) {
      reason ||= payments.some(payment => payment.payment_status === 'FAILED') ? 'FAILED' : 'CANCELLED';
    }
  }
  if (!reason && remote.order_status !== 'TERMINATION_REQUESTED') return order;
  order = await closeOrder(supabase, order, reason || 'CANCELLED', false);
  if (order.status === 'PAID' || order.credit_released) return order;
  if (remote.order_status !== 'TERMINATION_REQUESTED') {
    try { remote = await terminateCashfreeOrder(order.order_id); }
    catch (error) {
      // Cashfree may refuse termination because payment succeeded concurrently.
      try { remote = await getCashfreeOrder(order.order_id); }
      catch (lookupError) {
        if (isMissingCashfreeOrder(lookupError)) return closeOrder(supabase, order, order.close_reason || reason || 'CANCELLED', true);
        throw lookupError || error;
      }
    }
  }
  if (isVerifiedPaidOrder(remote, order)) return paid();
  if (['EXPIRED', 'TERMINATED'].includes(remote.order_status)) return closeOrder(supabase, order, order.close_reason || reason || 'CANCELLED', true);
  if (remote.order_status === 'TERMINATION_REQUESTED') {
    try {
      const settled = await waitForTermination(order.order_id);
      if (settled && isVerifiedPaidOrder(settled, order)) return paid();
      if (settled && ['EXPIRED', 'TERMINATED'].includes(settled.order_status)) {
        return closeOrder(supabase, order, order.close_reason || reason || 'CANCELLED', true);
      }
    } catch (error) {
      // Leave the durable cancellation request in place for the next refresh.
    }
  }
  // Cashfree can defer termination while a bank transaction is pending. Keep
  // the request durable and retry on refresh; never refund the reservation early.
  return order;
}
