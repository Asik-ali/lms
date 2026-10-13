import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/order-status.mjs';

test('invoice requires a paid owned order and completed purchase', async () => {
  const keys = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  const originalFetch = global.fetch;
  let status = 'PAID', granted = true, found = true;
  const items = [{ name: 'Course One', price: 499 }];
  global.fetch = async url => {
    const path = String(url);
    if (path.includes('/auth/v1/user')) return Response.json({ id: 'student-id' });
    if (path.includes('/profiles')) return Response.json({ id: 'student-id', role: 'student', name: 'Student', email: 'student@example.com' });
    if (path.includes('/purchase_orders')) {
      assert.ok(path.includes('student_id=eq.student-id'));
      return Response.json(found ? { order_id: 'LMS-1', amount: 499, status, cart_plans: items } : null);
    }
    if (path.includes('/purchases')) return Response.json({ amount: 499, granted, created_at: '2026-10-13T09:00:00Z' });
    throw new Error('Unexpected request: ' + path);
  };
  const response = () => ({ setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
  const req = { method: 'GET', headers: { authorization: 'Bearer token' }, query: { operation: 'invoice', orderId: 'LMS-1' } };
  try {
    const paid = response(); await handler(req, paid);
    assert.equal(paid.code, 200);
    assert.equal(paid.body.number, 'INV-LMS-1');
    assert.deepEqual(paid.body.items, items);
    assert.equal(paid.body.amount, 499);
    status = 'PENDING';
    const pending = response(); await handler(req, pending); assert.equal(pending.code, 409);
    status = 'PAID'; granted = false;
    const unfinished = response(); await handler(req, unfinished); assert.equal(unfinished.code, 409);
    found = false;
    const missing = response(); await handler(req, missing); assert.equal(missing.code, 404);
  } finally {
    global.fetch = originalFetch;
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
});
