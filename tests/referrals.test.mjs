import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReferralCode, resolveReferrer } from '../api/_referrals.mjs';
import orderStatus from '../api/order-status.mjs';
import createOrder from '../api/create-order.mjs';
import verifySignup from '../api/verify-signup.mjs';
import { reconcileOrder } from '../api/_order-lifecycle.mjs';
import webhook from '../api/cashfree-webhook.mjs';
import { createHmac } from 'node:crypto';

const response = () => ({ setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const buyer = '11111111-1111-4111-8111-111111111111';
async function withApi(fetcher, run) {
  const keys = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CASHFREE_CLIENT_ID', 'CASHFREE_CLIENT_SECRET', 'CASHFREE_SANDBOX_CLIENT_ID', 'CASHFREE_SANDBOX_CLIENT_SECRET', 'CASHFREE_WEBHOOK_SECRET'];
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

test('referral screen loads existing codes without payment-provider requests or code writes', async () => {
  await withApi((url, options) => {
    assert.ok(!url.includes('cashfree.com'), 'Referral loading must not wait for Cashfree');
    if (url.includes('/profiles')) return Response.json({ id: buyer, role: 'student', status: 'Active' });
    if (url.includes('/referral_codes')) {
      assert.ok(!options.method || options.method === 'GET', 'Existing referral codes should not be rewritten');
      return Response.json({ code: 'AB12CD34EF56' });
    }
    if (url.includes('/referral_settings')) return Response.json({ reward_amount: 100 });
    if (url.includes('/rpc/referral_credit_balance')) return Response.json(49);
    if (url.includes('/referrals')) return Response.json([], { headers: { 'content-range': '0-0/0' } });
    throw new Error('Unexpected request: ' + url);
  }, async () => {
    const res = response();
    await orderStatus({ method: 'GET', headers: { authorization: 'Bearer token' }, query: { operation: 'referrals' } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.code, 'AB12CD34EF56');
    assert.equal(res.body.availableCredit, 49);
    assert.equal(res.body.rewardAmount, 100);
  });
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
    if (url.includes('/rpc/close_purchase_order')) { const args = JSON.parse(options.body); writes.push(args); return Response.json({ order_id: args.cashfree_order_id, status: args.reason, credit_released: true }); }
    if (url.includes('/purchase_orders')) return Response.json(['expired', 'active'].map(order_id => ({ id: order_id, order_id, student_id: buyer, amount: 50 })));
    if (url.endsWith('/payments')) return Response.json([]);
    if (url.includes('cashfree.com/pg/orders/')) return Response.json({ order_id: url.endsWith('expired') ? 'expired' : 'active', order_currency: 'INR', order_amount: 50, customer_details: { customer_id: buyer }, order_status: url.endsWith('expired') ? 'EXPIRED' : 'ACTIVE' });
    if (url.includes('/rpc/referral_credit_balance')) return Response.json(100);
    throw new Error('Unexpected request: ' + url);
  }, async () => {
    const res = response();
    await orderStatus({ method: 'GET', headers: { authorization: 'Bearer token' }, query: { operation: 'referral-balance' } }, res);
    assert.equal(res.code, 200);
    assert.deepEqual(res.body, { availableCredit: 100 });
    assert.deepEqual(writes, [{ cashfree_order_id: 'expired', reason: 'CANCELLED', provider_closed: true }]);
  });
});

function lifecycleStore(initial) {
  let order = { ...initial };
  const calls = [];
  return {
    calls,
    get order() { return { ...order }; },
    async rpc(name, args) {
      calls.push([name, args]);
      if (name === 'fulfill_paid_order') { order.status = 'PAID'; return { error: null }; }
      if (order.status !== 'PAID' && !order.credit_released) {
        order.close_reason ||= args.reason;
        order.status = args.provider_closed ? order.close_reason : 'CANCELLING';
        order.credit_released = args.provider_closed;
      }
      return { data: { ...order }, error: null };
    },
  };
}
const pendingOrder = () => ({ id: 1, order_id: 'LMS-credit', student_id: buyer, amount: 1, credit_applied: 49, credit_released: false, status: 'PENDING' });
const remoteOrder = status => ({ order_id: 'LMS-credit', order_currency: 'INR', order_amount: 1, customer_details: { customer_id: buyer }, order_status: status });

test('a failed payment closes Cashfree before returning only its applied credit, once', async () => {
  let terminated = 0;
  const store = lifecycleStore(pendingOrder());
  await withApi((url, options) => {
    if (url.endsWith('/payments')) return Response.json([{ payment_status: 'FAILED' }]);
    if (options.method === 'PATCH') {
      terminated++;
      assert.equal(store.order.credit_released, false);
      assert.equal(store.order.status, 'CANCELLING');
      assert.deepEqual(JSON.parse(options.body), { order_status: 'TERMINATED' });
      return Response.json(remoteOrder('TERMINATED'));
    }
    return Response.json(remoteOrder('ACTIVE'));
  }, async () => {
    const result = await reconcileOrder(store, store.order, { inspectPayments: true });
    assert.equal(result.status, 'FAILED'); assert.equal(result.credit_released, true);
    assert.equal(result.credit_applied, 49);
    const count = store.calls.length;
    await reconcileOrder(store, store.order, { reason: 'FAILED' });
    assert.equal(store.calls.length, count); assert.equal(terminated, 1);
    assert.ok(store.calls.every(([name]) => name === 'close_purchase_order'));
  });
});

test('deferred cancellation holds credit until Cashfree confirms termination on a later refresh', async () => {
  let remoteStatus = 'ACTIVE';
  const store = lifecycleStore(pendingOrder());
  await withApi((_url, options) => Response.json(remoteOrder(options.method === 'PATCH' ? 'TERMINATION_REQUESTED' : remoteStatus)), async () => {
    const requested = await reconcileOrder(store, store.order, { reason: 'CANCELLED' });
    assert.equal(requested.status, 'CANCELLING'); assert.equal(requested.credit_released, false);
    remoteStatus = 'TERMINATED';
    const confirmed = await reconcileOrder(store, store.order);
    assert.equal(confirmed.status, 'CANCELLED'); assert.equal(confirmed.credit_released, true);
  });
});

test('successful and pending bank payments take precedence over earlier failures', async () => {
  const store = lifecycleStore(pendingOrder());
  let remoteStatus = 'ACTIVE';
  await withApi((url, options) => {
    assert.notEqual(options.method, 'PATCH');
    return Response.json(url.endsWith('/payments') ? [{ payment_status: 'FAILED' }, { payment_status: 'PENDING' }] : remoteOrder(remoteStatus));
  }, async () => {
    await reconcileOrder(store, store.order, { reason: 'FAILED', inspectPayments: true });
    assert.equal(store.calls.length, 0);
    remoteStatus = 'PAID';
    const result = await reconcileOrder(store, store.order, { reason: 'CANCELLED' });
    assert.equal(result.status, 'PAID'); assert.equal(result.credit_released, false);
    assert.equal(store.calls[0][0], 'fulfill_paid_order');
  });
});

test('provider mismatch or network failure cannot return credit', async () => {
  const store = lifecycleStore(pendingOrder());
  await withApi(() => Response.json({ ...remoteOrder('TERMINATED'), order_amount: 999 }), async () => {
    await assert.rejects(reconcileOrder(store, store.order, { reason: 'CANCELLED' }), /do not match/);
    assert.equal(store.calls.length, 0);
  });
  await withApi((_url, options) => {
    if (options.method === 'PATCH') throw new Error('network failure');
    return Response.json(remoteOrder('ACTIVE'));
  }, async () => {
    const result = await reconcileOrder(store, store.order, { reason: 'CANCELLED' });
    assert.equal(result.credit_released, false);
    assert.equal(result.status, 'CANCELLING');
  });
});

for (const paymentStatus of ['FAILED', 'CANCELLED', 'USER_DROPPED']) {
  test(`signed ${paymentStatus} webhook closes and returns used credit once across retries`, async () => {
    const store = lifecycleStore(pendingOrder());
    const rawBody = Buffer.from(JSON.stringify({ data: { order: { order_id: 'LMS-credit', order_amount: 1, order_currency: 'INR' }, payment: { payment_status: paymentStatus } } }));
    const timestamp = '123456789';
    const signature = createHmac('sha256', 'test-key').update(timestamp).update(rawBody).digest('base64');
    await withApi(async (url, options) => {
      if (url.includes('/purchase_orders')) return Response.json(store.order);
      if (url.includes('/rpc/close_purchase_order')) return Response.json((await store.rpc('close_purchase_order', JSON.parse(options.body))).data);
      if (url.endsWith('/payments')) return Response.json([{ payment_status: paymentStatus }]);
      return Response.json(remoteOrder(options.method === 'PATCH' ? 'TERMINATED' : 'ACTIVE'));
    }, async () => {
      const req = { method: 'POST', rawBody, headers: { 'x-webhook-timestamp': timestamp, 'x-webhook-signature': signature } };
      const res = response(); await webhook(req, res);
      assert.equal(res.code, 200);
      assert.equal(res.body.status, paymentStatus === 'FAILED' ? 'FAILED' : 'CANCELLED');
      assert.equal(store.order.credit_released, true);
      assert.equal(store.order.credit_applied, 49);
      const calls = store.calls.length;
      const retry = response(); await webhook(req, retry);
      assert.equal(retry.code, 200); assert.equal(store.calls.length, calls);
    });
  });
}

test('cancel endpoint requires POST and an order belonging to the current user', async () => {
  const method = response();
  await orderStatus({ method: 'GET', headers: {}, query: { operation: 'cancel' } }, method);
  assert.equal(method.code, 405);
  await withApi(url => {
    if (url.includes('/profiles')) return Response.json({ id: buyer, role: 'student', status: 'Active' });
    if (url.includes('/purchase_orders')) { assert.ok(url.includes(`student_id=eq.${buyer}`)); return Response.json(null); }
    throw new Error('Cancellation must not reach Cashfree for an unowned order');
  }, async () => {
    const res = response();
    await orderStatus({ method: 'POST', headers: { authorization: 'Bearer token' }, query: { operation: 'cancel' }, body: { orderId: 'someone-elses-order' } }, res);
    assert.equal(res.code, 404);
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
