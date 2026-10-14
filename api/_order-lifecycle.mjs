import { getCashfreeOrder, getCashfreePayments, terminateCashfreeOrder } from './_cashfree.mjs';
import { isVerifiedPaidOrder, fulfillPaidOrder } from './_fulfillment.mjs';

async function closeOrder(supabase, order, reason, providerClosed) {
  const { data, error } = await supabase.rpc('close_purchase_order', {
    cashfree_order_id: order.order_id, reason, provider_closed: providerClosed,
  });
  if (error) throw error;
  return data;
}

export async function reconcileOrder(supabase, order, { reason, inspectPayments = false } = {}) {
  if (order.status === 'PAID' || order.credit_released) return order;
  let remote = await getCashfreeOrder(order.order_id);
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
    catch {
      // Cashfree may refuse termination because payment succeeded concurrently.
      remote = await getCashfreeOrder(order.order_id);
    }
  }
  if (isVerifiedPaidOrder(remote, order)) return paid();
  if (['EXPIRED', 'TERMINATED'].includes(remote.order_status)) return closeOrder(supabase, order, order.close_reason || reason || 'CANCELLED', true);
  // Cashfree can defer termination while a bank transaction is pending. Keep
  // the request durable and retry on refresh; never refund the reservation early.
  return order;
}
