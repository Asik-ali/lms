import { createServiceClient, getAuthedUser, setCors } from './_auth.mjs';

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  const supabase = createServiceClient();

  try {
    const profile = await getAuthedUser(req, supabase);
    if (!profile) return res.status(401).json({ error: 'Not authorized' });

    const { orderId } = req.query || {};

    if (orderId) {
      const { data: order, error } = await supabase
        .from('purchase_orders')
        .select('id, order_id, plan_id, student_id, amount, status, created_at')
        .eq('order_id', orderId)
        .eq('student_id', profile.id)
        .maybeSingle();
      if (error) throw error;
      return res.status(200).json(order || null);
    }

    // Return the student's recent orders + completed purchases
    const { data: orders, error: oErr } = await supabase
      .from('purchase_orders')
      .select('id, order_id, plan_id, amount, status, created_at')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });
    if (oErr) throw oErr;

    const { data: purchases, error: pErr } = await supabase
      .from('purchases')
      .select('id, order_id, plan_id, amount, created_at')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });
    if (pErr) throw pErr;

    return res.status(200).json({ orders: orders || [], purchases: purchases || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load order status' });
  }
}
