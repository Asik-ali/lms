import test from 'node:test';
import assert from 'node:assert/strict';
import { isVerifiedPaidOrder, fulfillPaidOrder } from '../api/_fulfillment.mjs';
const local = { order_id: 'LMS-1', amount: 99, student_id: 'student-1' };
const remote = { order_id: 'LMS-1', order_amount: 99, order_currency: 'INR', customer_details: { customer_id: 'student-1' }, order_status: 'PAID' };
test('only a paid matching Cashfree order qualifies for access', () => {
  assert.equal(isVerifiedPaidOrder(remote, local), true);
  for (const status of ['ACTIVE', 'EXPIRED', 'FAILED', 'CANCELLED']) {
    assert.equal(isVerifiedPaidOrder({ ...remote, order_status: status }, local), false);
  }
  for (const change of [{ order_amount: 1 }, { order_currency: 'USD' }, { order_id: 'other' }, { customer_details: { customer_id: 'other' } }]) {
    assert.throws(() => isVerifiedPaidOrder({ ...remote, ...change }, local), /do not match/);
  }
});
test('fulfillment awaits the atomic database grant and surfaces errors', async () => {
  let called;
  await fulfillPaidOrder({ rpc: async (...args) => { called = args; return { error: null }; } }, 'LMS-1');
  assert.deepEqual(called, ['fulfill_paid_order', { cashfree_order_id: 'LMS-1' }]);
  await assert.rejects(fulfillPaidOrder({ rpc: async () => ({ error: new Error('database failed') }) }, 'LMS-1'), /database failed/);
});


test('cart checkout uses authenticated student and database total instead of submitted price', async () => {
  const { default: createOrder } = await import('../api/create-order.mjs');
  const keys = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CASHFREE_CLIENT_ID', 'CASHFREE_CLIENT_SECRET', 'CASHFREE_SANDBOX_CLIENT_ID', 'CASHFREE_SANDBOX_CLIENT_SECRET'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  for (const key of keys) process.env[key] = key === 'VITE_SUPABASE_URL' ? 'https://test.supabase.co' : 'test-key';
  const originalFetch = global.fetch;
  let cartRequest;
  let providerRequest;
  let accessWrites = 0;
  global.fetch = async (url, options = {}) => {
    const path = String(url);
    if (path.includes('/auth/v1/user')) return Response.json({ id: 'student-1' });
    if (path.includes('/rest/v1/profiles')) {
      if (options.method && options.method !== 'GET') accessWrites++;
      return Response.json({ id: 'student-1', role: 'student', name: 'Student', email: 'student@example.com' });
    }
    if (path.includes('/rpc/create_purchase_cart')) {
      cartRequest = JSON.parse(options.body);
      return Response.json({ id: 42, amount: 250.24, plan_name: 'Maths, Complete Bundle' });
    }
    if (path.includes('cashfree.com/pg/orders')) {
      providerRequest = JSON.parse(options.body);
      return Response.json({ payment_session_id: 'session-test' });
    }
    if (path.includes('/rest/v1/purchase_orders')) return new Response(null, { status: 204 });
    throw new Error('Unexpected request: ' + path);
  };
  const response = () => ({ setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
  try {
    const res = response();
    await createOrder({ method: 'POST', headers: { authorization: 'Bearer token', host: 'example.com' }, body: { planIds: [1,2,1], amount: 1, student_id: 'other' } }, res);
    assert.equal(res.code, 200);
    assert.deepEqual(cartRequest.selected_plan_ids, [1,2]);
    assert.equal(cartRequest.buyer_id, 'student-1');
    assert.equal(providerRequest.order_amount, 250.24);
    assert.equal(res.body.amount, 250.24);
    assert.equal(accessWrites, 0);
    const invalid = response();
    await createOrder({ method: 'POST', headers: { authorization: 'Bearer token' }, body: { planIds: [-1] } }, invalid);
    assert.equal(invalid.code, 400);
  } finally {
    global.fetch = originalFetch;
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
});
