import { createServiceClient, requireAdmin } from './_auth.mjs';

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
  const supabase = createServiceClient();

  try {
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
        .select('id, name, description, price, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(plans || []);
    }

    // POST /api/sales-plans  -> create plan with items
    if (req.method === 'POST') {
      const { name, description, price, status, items } = req.body || {};
      if (!name?.trim()) return res.status(400).json({ error: 'Plan name is required.' });
      if (price === undefined || price === null || Number(price) < 0) {
        return res.status(400).json({ error: 'A valid price is required.' });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Select at least one course or test series.' });
      }

      const { data: plan, error } = await supabase
        .from('sales_plans')
        .insert({ name: name.trim(), description: description || '', price: Number(price), status: status || 'active' })
        .select('id, name, description, price, status, created_at')
        .single();
      if (error) throw error;

      const rows = items.map(it => ({
        plan_id: plan.id,
        item_type: it.item_type,
        item_id: Number(it.item_id),
      }));
      const { error: itemsErr } = await supabase.from('sales_plan_items').insert(rows);
      if (itemsErr) throw itemsErr;

      return res.status(200).json(plan);
    }

    // PUT /api/sales-plans?planId=X  -> update plan + replace items
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const id = Number(req.query?.planId || req.body?.id);
      if (!id) return res.status(400).json({ error: 'Plan id is required.' });

      const body = req.body || {};
      const update = {};
      if (body.name !== undefined) update.name = body.name.trim();
      if (body.description !== undefined) update.description = body.description;
      if (body.price !== undefined) update.price = Number(body.price);
      if (body.status !== undefined) update.status = body.status;

      const { data: plan, error } = await supabase
        .from('sales_plans')
        .update(update)
        .eq('id', id)
        .select('id, name, description, price, status, created_at')
        .single();
      if (error) throw error;

      if (Array.isArray(body.items)) {
        await supabase.from('sales_plan_items').delete().eq('plan_id', id);
        if (body.items.length > 0) {
          const rows = body.items.map(it => ({
            plan_id: id,
            item_type: it.item_type,
            item_id: Number(it.item_id),
          }));
          const { error: itemsErr } = await supabase.from('sales_plan_items').insert(rows);
          if (itemsErr) throw itemsErr;
        }
      }

      const withItems = await getPlanWithItems(supabase, id);
      return res.status(200).json(withItems);
    }

    // DELETE /api/sales-plans?planId=X
    if (req.method === 'DELETE') {
      const id = Number(req.query?.planId);
      if (!id) return res.status(400).json({ error: 'Plan id is required.' });
      const { error } = await supabase.from('sales_plans').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to process sales plans' });
  }
}
