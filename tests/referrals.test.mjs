import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReferralCode, resolveReferrer } from '../api/_referrals.mjs';
import orderStatus from '../api/order-status.mjs';
import createOrder from '../api/create-order.mjs';
import verifySignup from '../api/verify-signup.mjs';

const response = () => ({ setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const buyer = '11111111-1111-4111-8111-111111111111';
async function withApi(fetcher, run) {
  const keys = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CASHFREE_CLIENT_ID', 'CASHFREE_CLIENT_SECRET', 'CASHFREE_SANDBOX_CLIENT_ID', 'CASHFREE_SANDBOX_CLIENT_SECRET'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const original = global.fetch;
  for (const key of keys) process.env[key] = key === 'VITE_SUPABASE_URL' ? 'https://test.supabase.co' : 'test-key';
  global.fetch = async (url, options = {}) => {
    const path = String(url);
    if (path.includes('/auth/v1/user')) return Response.json({ id: buyer });
    return fetcher(path, options);
  };
  try { await run(); }
  finally {
    global.fetch = original;
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
}

test('referral code normalizes without accepting malformed values', () => {
  assert.equal(normalizeReferralCode(' ab12cd34ef56 '), 'AB12CD34EF56');
  for (const value of ['', undefined, null, '   ']) assert.equal(normalizeReferralCode(value), '');
  for (const value of [123, {}, 'x', 'AB12CD34EF56<script>']) assert.throws(() => normalizeReferralCode(value), /Invalid/);
});

test('only active student referral codes resolve and database errors are preserved', async () => {
  const client = result => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => result }) }) }) });
  assert.equal(await resolveReferrer(client({ data: { student_id: buyer, student: { role: 'student', status: 'Active' } } }), 'AB12CD34EF56'), buyer);
  for (const data of [null, { student: { role: 'admin' } }, { student: { role: 'student', status: 'Suspended' } }]) {
    await assert.rejects(resolveReferrer(client({ data }), 'AB12CD34EF56'), /unavailable/);
  }
  await assert.rejects(resolveReferrer(client({ error: new Error('db unavailable') }), 'AB12CD34EF56'), /db unavailable/);
});

test('credit checkout uses the authenticated balance RPC and sends only the discounted amount to Cashfree', async () => {
  let rpcBody, providerBody;
  await withApi((url, options) => {
    if (url.includes('/profiles')) return Response.json({ id: buyer, role: 'student', status: 'Active', name: 'Student', email: 'student@example.com' });
    if (url.includes('/rpc/create_purchase_cart_with_credit')) {
      rpcBody = JSON.parse(options.body);
      return Response.json({ id: 1, amount: 50, credit_applied: 100, plan_name: 'Course' });
    }
    if (url.includes('cashfree.com/pg/orders')) { providerBody = JSON.parse(options.body); return Response.json({ payment_session_id: 'session' }); }
    if (url.includes('/purchase_orders')) return new Response(null, { status: 204 });
    throw new Error('Unexpected request: ' + url);
  }, async () => {
    const res = response();
    await createOrder({ method: 'POST', headers: { authorization: 'Bearer token' }, body: { planIds: [1], useCredit: true, amount: 1, credit: 999999, student_id: 'other' } }, res);
    assert.equal(res.code, 200);
    assert.equal(rpcBody.buyer_id, buyer);
    assert.equal(rpcBody.use_credit, true);
    assert.equal(providerBody.order_amount, 50);
    assert.ok(providerBody.order_expiry_time);
    assert.equal(res.body.credit_applied, 100);
  });
});

test('balance reconciliation releases expired orders but reserves credit on active orders and failed attempts', async () => {
  const writes = [];
  await withApi((url, options) => {
    if (url.includes('/profiles')) return Response.json({ id: buyer, role: 'student', status: 'Active' });
    if (url.includes('/purchase_orders') && options.method === 'PATCH') { writes.push(JSON.parse(options.body)); return new Response(null, { status: 204 }); }
    if (url.includes('/purchase_orders')) return Response.json(['expired', 'active'].map(order_id => ({ id: order_id, order_id, student_id: buyer, amount: 50 })));
    if (url.includes('cashfree.com/pg/orders/')) return Response.json({ order_id: url.endsWith('expired') ? 'expired' : 'active', order_currency: 'INR', order_amount: 50, customer_details: { customer_id: buyer }, order_status: url.endsWith('expired') ? 'EXPIRED' : 'ACTIVE' });
    if (url.includes('/rpc/referral_credit_balance')) return Response.json(100);
    throw new Error('Unexpected request: ' + url);
  }, async () => {
    const res = response();
    await orderStatus({ method: 'GET', headers: { authorization: 'Bearer token' }, query: { operation: 'referral-balance' } }, res);
    assert.equal(res.code, 200);
    assert.deepEqual(res.body, { availableCredit: 100 });
    assert.deepEqual(writes, [{ status: 'CANCELLED', credit_released: true }]);
  });
});

test('failed referral attribution rolls back the new account instead of silently losing the referral', async () => {
  let deleted = false;
  await withApi((url, options) => {
    if (url.includes('/pending_signups')) return Response.json({ id: 1, otp: '123456', expires_at: new Date(Date.now() + 60000).toISOString(), referrer_id: 'referrer', name: 'Student', username: 'student', password: 'password' });
    if (url.includes('/auth/v1/admin/users') && options.method === 'DELETE') { deleted = true; return Response.json({}); }
    if (url.includes('/auth/v1/admin/users')) return Response.json({ id: buyer, email: 'student@example.com' });
    if (url.includes('/profiles')) return Response.json({ id: buyer });
    if (url.includes('/referrals')) return Response.json({ message: 'attribution failed', code: '23503' }, { status: 400 });
    throw new Error('Unexpected request: ' + url);
  }, async () => {
    const res = response();
    await verifySignup({ method: 'POST', headers: {}, body: { email: 'student@example.com', otp: '123456' } }, res);
    assert.equal(res.code, 500);
    assert.match(res.body.error, /attribution failed/);
    assert.equal(deleted, true);
  });
});
