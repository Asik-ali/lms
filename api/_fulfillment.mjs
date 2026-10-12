export async function fulfillPaidOrder(supabase, orderId) {
  const { error } = await supabase.rpc('fulfill_paid_order', { cashfree_order_id: orderId });
  if (error) throw error;
}

export function isVerifiedPaidOrder(remote, local) {
  if (remote.order_id !== local.order_id || remote.order_currency !== 'INR' ||
      !Number.isFinite(Number(remote.order_amount)) || Number(remote.order_amount) !== Number(local.amount) ||
      remote.customer_details?.customer_id !== local.student_id) {
    throw new Error('Payment order details do not match');
  }
  return remote.order_status === 'PAID';
}
