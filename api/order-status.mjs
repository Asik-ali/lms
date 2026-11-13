import { reconcileOrder } from './_order-lifecycle.mjs';
import { createServiceClient, getAuthedUser, requireAdmin, setCors } from './_auth.mjs';
import referralsHandler from './_referrals-handler.mjs';
import { PAYMENT_ORDER_CLEANUP_MINUTES, terminateCashfreeOrder } from './_cashfree.mjs';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (['referrals', 'referral-balance', 'referral-settings'].includes(req.query?.operation)) return referralsHandler(req, res);
  if (setCors(req, res)) return;

  const adminCancellation = req.query?.operation === 'admin-cancel';
  if (adminCancellation) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const supabase = createServiceClient();
      if (!await requireAdmin(req, res, supabase)) return;
      const orderId = String(req.body?.orderId || '').trim();
      if (!orderId) return res.status(400).json({ error: 'Order ID is required.' });
      const { data: order, error: lookupError } = await supabase
        .from('purchase_orders').select('id, order_id, status').eq('order_id', orderId).maybeSingle();
      if (lookupError) throw lookupError;
      if (!order) return res.status(404).json({ error: 'Order not found.' });
      if (order.status === 'PAID') return res.status(409).json({ error: 'A paid order cannot be cancelled.' });
      try { await terminateCashfreeOrder(order.order_id); } catch { /* Retried during later reconciliation. */ }
      const { data: updated, error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: 'CANCELLED', close_reason: 'CANCELLED' })
        .eq('id', order.id).neq('status', 'PAID')
        .select('id, order_id, status').maybeSingle();
      if (updateError) throw updateError;
      if (!updated) return res.status(409).json({ error: 'The order was paid and cannot be cancelled.' });
      return res.status(200).json({ success: true, order: updated });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Unable to cancel order.' });
    }
  }

  const closing = ['cancel', 'failed'].includes(req.query?.operation);
  const emailInvoice = req.query?.operation === 'email-invoice';
  if (req.method !== (closing || emailInvoice ? 'POST' : 'GET')) return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');

  try {
    const supabase = createServiceClient();
    const profile = await getAuthedUser(req, supabase);
    if (!profile) return res.status(401).json({ error: 'Not authorized' });

    const orderId = closing || emailInvoice ? req.body?.orderId : req.query?.orderId;
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
      if (emailInvoice) {
        if (order.status !== 'PAID') return res.status(409).json({ error: 'Invoices are available only after payment confirmation.' });
        if (!profile.email) return res.status(400).json({ error: 'Your account has no email address.' });
        const { data: purchase, error: purchaseError } = await supabase.from('purchases')
          .select('order_id, amount, granted, created_at').eq('order_id', orderId)
          .eq('student_id', profile.id).maybeSingle();
        if (purchaseError) throw purchaseError;
        if (!purchase?.granted || Number(purchase.amount) !== Number(order.amount)) {
          return res.status(409).json({ error: 'Your purchase is still being finalized. Please try again shortly.' });
        }
        const { data: smtp } = await supabase.from('smtp_settings').select('*').limit(1).maybeSingle();
        if (!smtp?.username || !smtp?.password) return res.status(400).json({ error: 'Invoice email is not configured yet. Please contact support.' });
        const amount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(order.amount));
        const itemLines = (order.cart_plans || [{ name: 'Course / test purchase' }]).map((item, index) => `${index + 1}. ${item.name}`).join('\n');
        const transport = nodemailer.createTransport({ host: smtp.host, port: Number(smtp.port), secure: Number(smtp.port) === 465, auth: { user: smtp.username, pass: smtp.password } });
        await transport.sendMail({
          from: `"${smtp.sender_name || 'EXAMSTICK'}" <${smtp.username}>`, to: profile.email,
          subject: `Invoice ${order.order_id} — EXAMSTICK`,
          text: `Hello ${profile.name || 'Student'},\n\nYour payment invoice\nInvoice number: INV-${order.order_id}\nOrder ID: ${order.order_id}\nDate: ${new Date(purchase.created_at).toLocaleDateString('en-IN')}\nStatus: PAID\n\nItems:\n${itemLines}\n\nTotal paid: ${amount}\n\nThank you for learning with EXAMSTICK.`,
        });
        return res.status(200).json({ success: true, email: profile.email });
      }
      const updated = await reconcileOrder(supabase, order, {
        reason: closing ? (req.query.operation === 'failed' ? 'FAILED' : 'CANCELLED')
          : (Date.now() - new Date(order.created_at).getTime() >= PAYMENT_ORDER_CLEANUP_MINUTES * 60 * 1000 ? 'CANCELLED' : undefined),
        inspectPayments: !closing,
        allowImmediateRetry: req.query?.operation === 'cancel',
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
    const cutoff = Date.now() - PAYMENT_ORDER_CLEANUP_MINUTES * 60 * 1000;
    const unfinished = (orders || []).filter(order => order.status !== 'PAID' && !order.credit_released &&
      (['CANCELLING', 'FAILED', 'CANCELLED'].includes(order.status) || new Date(order.created_at).getTime() <= cutoff)).slice(0, 10);
    const refreshed = await Promise.allSettled(unfinished.map(order => reconcileOrder(supabase, order, {
      reason: new Date(order.created_at).getTime() <= cutoff ? 'CANCELLED' : undefined,
      inspectPayments: true,
    })));
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
