import { createServiceClient } from './_auth.mjs';
import { readRawBody, verifyWebhookSignature } from './_webhook.mjs';

export const config = { api: { bodyParser: false } };

async function grantPlanAccess(supabase, studentId, planId) {
  const { data: items, error: itemsErr } = await supabase
    .from('sales_plan_items')
    .select('item_type, item_id')
    .eq('plan_id', planId);
  if (itemsErr) throw itemsErr;

  const courseIds = (items || []).filter(i => i.item_type === 'course').map(i => i.item_id);
  const seriesIds = (items || []).filter(i => i.item_type === 'test_series').map(i => i.item_id);

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, course, test_series_access')
    .eq('id', studentId)
    .maybeSingle();
  if (profileErr) throw profileErr;
  if (!profile) throw new Error('Student profile not found');

  const currentCourses = (profile.course || '').split(',').map(s => s.trim()).filter(Boolean);
  const currentSeries = (profile.test_series_access || '').split(',').map(s => s.trim()).filter(Boolean);
  const grantedCourseNames = [];
  const grantedSeriesNames = [];

  if (courseIds.length > 0) {
    const { data: courses, error: cErr } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds);
    if (cErr) throw cErr;
    for (const c of courses || []) {
      if (!currentCourses.includes(c.title)) {
        currentCourses.push(c.title);
        grantedCourseNames.push(c.title);
      }
    }
  }

  if (seriesIds.length > 0) {
    const { data: series, error: sErr } = await supabase
      .from('test_series')
      .select('id, name')
      .in('id', seriesIds);
    if (sErr) throw sErr;
    for (const s of series || []) {
      if (!currentSeries.includes(s.name)) {
        currentSeries.push(s.name);
        grantedSeriesNames.push(s.name);
      }
    }
  }

  const { error: upErr } = await supabase
    .from('profiles')
    .update({
      course: currentCourses.join(', ') || null,
      test_series_access: currentSeries.join(', ') || null,
    })
    .eq('id', studentId);
  if (upErr) throw upErr;

  return {
    granted: [...grantedCourseNames, ...grantedSeriesNames],
    courses: grantedCourseNames,
    series: grantedSeriesNames,
  };
}

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
      .select('id, order_id, plan_id, student_id, amount, status')
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
      const grant = await grantPlanAccess(supabase, order.student_id, order.plan_id);

      const { error: purchaseErr } = await supabase.from('purchases').upsert({
        order_id: orderId,
        plan_id: order.plan_id,
        student_id: order.student_id,
        amount: order.amount,
        granted: true,
      }, { onConflict: 'order_id' });
      if (purchaseErr) throw purchaseErr;
      const { error: paidError } = await supabase.from('purchase_orders').update({ status: 'PAID' }).eq('id', order.id);
      if (paidError) throw paidError;

      return res.status(200).json({
        success: true,
        granted: grant.granted,
        courses: grant.courses,
        series: grant.series,
      });
    }

    if (orderStatus === 'FAILED' || orderStatus === 'CANCELLED') {
      const { error } = await supabase.from('purchase_orders').update({ status: orderStatus }).eq('id', order.id).neq('status', 'PAID');
      if (error) throw error;
    }

    return res.status(200).json({ success: true, status: orderStatus });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
}
