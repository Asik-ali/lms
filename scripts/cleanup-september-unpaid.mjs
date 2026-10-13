import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';

const start = '2026-08-31T18:30:00.000Z';
const end = '2026-09-30T18:30:00.000Z';
const unpaid = ['PENDING', 'FAILED', 'CANCELLED', 'EXPIRED'];
const client = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const candidates = [];
for (let offset = 0; ; offset += 500) {
  const { data, error } = await client.from('purchase_orders').select('*, student:profiles!inner(role)')
    .eq('student.role', 'student').gte('created_at', start).lt('created_at', end)
    .in('status', unpaid).order('id').range(offset, offset + 499);
  if (error) throw new Error(`Unable to read orders: ${error.message}`);
  candidates.push(...data);
  if (data.length < 500) break;
}
const protectedOrders = new Set();
for (let offset = 0; offset < candidates.length; offset += 100) {
  const { data, error } = await client.from('purchases').select('order_id')
    .in('order_id', candidates.slice(offset, offset + 100).map(order => order.order_id));
  if (error) throw new Error(`Unable to check purchases: ${error.message}`);
  data.forEach(purchase => protectedOrders.add(purchase.order_id));
}
const eligible = candidates.filter(order => !protectedOrders.has(order.order_id));
console.log(JSON.stringify({ month: 'September 2026 (Asia/Kolkata)', unpaidOrders: candidates.length,
  protectedByPurchase: protectedOrders.size, eligibleForDeletion: eligible.length }));
if (process.argv.includes('--execute') && eligible.length) {
  await mkdir('.local-data', { recursive: true });
  await writeFile('.local-data/september-2026-unpaid-orders-backup.json', JSON.stringify(eligible, null, 2));
  let removed = 0;
  for (let offset = 0; offset < eligible.length; offset += 100) {
    const { data, error } = await client.from('purchase_orders').delete()
      .in('id', eligible.slice(offset, offset + 100).map(order => order.id))
      .in('status', unpaid).gte('created_at', start).lt('created_at', end).select('id');
    if (error) throw new Error(`Unable to delete orders: ${error.message}`);
    removed += data.length;
  }
  console.log(JSON.stringify({ deleted: removed }));
}
