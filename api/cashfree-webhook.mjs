import { createServiceClient } from './_auth.mjs';
import { fulfillPaidOrder } from './_fulfillment.mjs';
import { reconcileOrder } from './_order-lifecycle.mjs';
import { readRawBody, verifyWebhookSignature } from './_webhook.mjs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const secret = process.env.CASHFREE_WEBHOOK_SECRET ||
      ((process.env.CASHFREE_MODE || 'production').toLowerCase() === 'sandbox'
        ? process.env.CASHFREE_SANDBOX_CLIENT_SECRET : process.env.CASHFREE_CLIENT_SECRET);
    if (!secret) return res.status(503).json({ error: 'Webhook verification is not configured' });
    const rawBody = await readRawBody(req);
    if (!verifyWebhookSignature(rawBody, req.headers?.['x-webhook-timestamp'], req.headers?.['x-webhook-signature'], secret)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    let payload;
    try { payload = JSON.parse(rawBody.toString('utf8')); }
    catch { return res.status(400).json({ error: 'Invalid webhook JSON' }); }
    const data = payload?.data || {};
    const orderId = data?.order?.order_id;
    const paymentStatus = data?.payment?.payment_status;
    const orderStatus = paymentStatus === 'SUCCESS' ? 'PAID' : paymentStatus;
    const orderAmount = data?.order?.order_amount;

    if (!orderId) return res.status(400).json({ error: 'Missing order_id' });

    const supabase = createServiceClient();

    // Look up the pending order
    const { data: order, error: orderErr } = await supabase
      .from('purchase_orders')
      .select('id, order_id, plan_id, student_id, amount, status, credit_applied, credit_released, close_reason')
      .eq('order_id', orderId)
      .maybeSingle();
    if (orderErr) throw orderErr;
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!Number.isFinite(Number(orderAmount)) || Number(orderAmount) !== Number(order.amount) || data.order.order_currency !== 'INR') {
      return res.status(400).json({ error: 'Order amount or currency does not match' });
    }

    // Only process payment events; ignore if already PAID
    if (order.status === 'PAID') {
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    if (orderStatus === 'PAID') {
      await fulfillPaidOrder(supabase, orderId);
      return res.status(200).json({ success: true, status: 'PAID' });
    }

    if (['FAILED', 'CANCELLED', 'USER_DROPPED'].includes(orderStatus)) {
      const updated = await reconcileOrder(supabase, order, { reason: orderStatus === 'FAILED' ? 'FAILED' : 'CANCELLED', inspectPayments: true });
      return res.status(200).json({ success: true, status: updated.status });
    }

    return res.status(200).json({ success: true, status: orderStatus });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
}
