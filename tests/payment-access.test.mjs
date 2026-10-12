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
