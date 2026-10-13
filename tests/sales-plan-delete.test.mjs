import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/sales-plans.mjs';

test('permanent deletion uses atomic RPC and reports migration and database failures', async () => {
  const keys = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  const previousFetch = global.fetch;
  let failure = null;
  let role = 'admin';
  const calls = [];
  global.fetch = async (url, options = {}) => {
    const path = String(url);
    if (path.includes('/auth/v1/user')) return Response.json({ id: 'admin-id' });
    if (path.includes('/rest/v1/profiles')) return Response.json({ role });
    if (path.includes('/rpc/delete_sales_plan')) {
      calls.push(JSON.parse(options.body));
      return failure ? Response.json(failure, { status: 400 }) : Response.json(null);
    }
    throw new Error('Unexpected request: ' + path);
  };
  const response = () => ({ setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
  const req = { method: 'DELETE', headers: { authorization: 'Bearer admin-token' }, query: { planId: '1' } };
  try {
    const deleted = response();
    await handler(req, deleted);
    assert.equal(deleted.code, 200);
    assert.deepEqual(deleted.body, { success: true });
    assert.deepEqual(calls, [{ target_plan_id: 1 }]);
    failure = { code: 'PGRST202', message: 'Function missing' };
    const missing = response(); await handler(req, missing);
    assert.equal(missing.code, 503);
    assert.match(missing.body.error, /allow_permanent_plan_delete.sql/);
    failure = { message: 'Database failed' };
    const failed = response(); await handler(req, failed);
    assert.equal(failed.code, 500);
    role = 'student';
    const denied = response(); await handler(req, denied);
    assert.equal(denied.code, 401);
    assert.equal(calls.length, 3);
  } finally {
    global.fetch = previousFetch;
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
});
