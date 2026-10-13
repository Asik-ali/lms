import test from 'node:test';
import assert from 'node:assert/strict';
import { ownsPlan, cartSelection, cartTotal } from '../src/data/shopCart.js';
const course = { id: 1, price: 99.99, items: [{ item_type: 'course', item_id: 1, label: 'Maths' }] };
const bundle = { id: 2, price: 150.25, items: [...course.items, { item_type: 'test_series', item_id: 2, label: 'SSC' }] };
test('cart excludes unavailable and fully owned plans without duplicating selected IDs', () => {
  assert.deepEqual(cartSelection([course, bundle], [1, '1', 2, 99], {}).map(p => p.id), [1,2]);
  assert.deepEqual(cartSelection([course, bundle], [1,2], { course: 'maths' }).map(p => p.id), [2]);
  assert.deepEqual(cartSelection([course, bundle], [1,2], { course: 'Maths', test_series_access: 'SSC' }), []);
  assert.equal(ownsPlan({ items: [] }, {}), false);
});
test('cart total preserves paise and bundles grant all selected content', () => {
  assert.equal(cartTotal([course, bundle]), 250.24);
  assert.equal(ownsPlan(bundle, { course: 'Maths' }), false);
  assert.equal(ownsPlan(bundle, { course: 'Maths', test_series_access: 'ssc' }), true);
});
