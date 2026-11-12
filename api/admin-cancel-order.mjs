import { createServiceClient, requireAdmin, setCors } from './_auth.mjs';
import { terminateCashfreeOrder } from './_cashfree.mjs';

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = createServiceClient();
    if (!await requireAdmin(req, res, supabase)) return;

    const orderId = String(req.body?.orderId || '').trim();
    if (!orderId) return res.status(400).json({ error: 'Order ID is required.' });

    const { data: order, error: lookupError } = await supabase
      .from('purchase_orders')
      .select('id, order_id, status')
      .eq('order_id', orderId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.status === 'PAID') return res.status(409).json({ error: 'A paid order cannot be cancelled.' });

    // Stop the old provider checkout when possible. Cashfree may complete this
    // asynchronously, but admin cancellation must immediately unblock a new order.
    try { await terminateCashfreeOrder(order.order_id); } catch { /* Retried during later reconciliation. */ }

    const { data: updated, error: updateError } = await supabase
      .from('purchase_orders')
      .update({ status: 'CANCELLED', close_reason: 'CANCELLED' })
      .eq('id', order.id)
      .neq('status', 'PAID')
      .select('id, order_id, status')
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) return res.status(409).json({ error: 'The order was paid and cannot be cancelled.' });

    return res.status(200).json({ success: true, order: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to cancel order.' });
  }
}
