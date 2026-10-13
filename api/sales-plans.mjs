import { createServiceClient, requireAdmin, setCors } from './_auth.mjs';

async function getPlanWithItems(supabase, id) {
  const { data: plan, error } = await supabase
    .from('sales_plans')
    .select('id, name, description, price, status, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!plan) return null;

  const { data: items, error: itemsErr } = await supabase
    .from('sales_plan_items')
    .select('id, item_type, item_id')
    .eq('plan_id', id);
  if (itemsErr) throw itemsErr;

  return { ...plan, items: items || [] };
}

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  try {
    const supabase = createServiceClient();
    const allowed = await requireAdmin(req, res, supabase);
    if (!allowed) return;

    // GET /api/sales-plans?planId=1  -> single plan with items
    if (req.method === 'GET') {
      if (req.query?.planId) {
        const plan = await getPlanWithItems(supabase, req.query.planId);
        return res.status(200).json(plan || null);
      }
      const { data: plans, error } = await supabase
        .from('sales_plans')
        .select('id, name, description, price, status, created_at, items:sales_plan_items(id, item_type, item_id)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(plans || []);
    }

    // POST /api/sales-plans  -> create plan with items
    if (req.method === 'POST') {
      const { data, error } = await supabase.rpc('save_sales_plan', {
        target_plan_id: null, plan_body: req.body || {},
      });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const id = Number(req.query?.planId || req.body?.id);
      if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: 'Plan id is required.' });
      const { data, error } = await supabase.rpc('save_sales_plan', {
        target_plan_id: id, plan_body: req.body || {},
      });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // DELETE /api/sales-plans?planId=X
    if (req.method === 'DELETE') {
      const id = Number(req.query?.planId);
      if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: 'Plan id is required.' });
      const { error } = await supabase.from('sales_plans').delete().eq('id', id);
      // Referenced plans must remain available for payment fulfillment and history.
      // Let the foreign key detect references, including concurrent checkouts.
      if (error?.code === '23503') {
        const { error: archiveError } = await supabase.from('sales_plans')
          .update({ status: 'inactive' }).eq('id', id);
        if (archiveError) throw archiveError;
        return res.status(200).json({ success: true, archived: true });
      }
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to process sales plans' });
  }
}
