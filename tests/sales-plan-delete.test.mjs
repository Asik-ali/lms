import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/sales-plans.mjs';

test('referenced plans are archived without deleting purchases; unused plans are deleted', async () => {
  const keys = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  const previousFetch = global.fetch;
  let referenced = true;
  let archiveFails = false;
  let patches = [];
  global.fetch = async (url, options = {}) => {
    const path = String(url);
    if (path.includes('/auth/v1/user')) return Response.json({ id: 'admin-id' });
    if (path.includes('/rest/v1/profiles')) return Response.json({ role: 'admin' });
    if (path.includes('/rest/v1/sales_plans')) {
      if (options.method === 'DELETE') return referenced
        ? Response.json({ code: '23503', message: 'Foreign key violation' }, { status: 409 })
        : new Response(null, { status: 204 });
      if (options.method === 'PATCH') {
        patches.push(JSON.parse(options.body));
        return archiveFails ? Response.json({ message: 'Archive failed' }, { status: 500 }) : new Response(null, { status: 204 });
      }
    }
    throw new Error('Unexpected request: ' + path);
  };
  const response = () => ({ setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
  const req = { method: 'DELETE', headers: { authorization: 'Bearer admin-token' }, query: { planId: '1' } };
  try {
    const archived = response();
    await handler(req, archived);
    assert.equal(archived.code, 200);
    assert.equal(archived.body.archived, true);
    assert.deepEqual(patches, [{ status: 'inactive' }]);
    referenced = false;
    const deleted = response();
    await handler(req, deleted);
    assert.equal(deleted.code, 200);
    assert.deepEqual(deleted.body, { success: true });
    assert.equal(patches.length, 1);
    referenced = true; archiveFails = true;
    const failed = response();
    await handler(req, failed);
    assert.equal(failed.code, 500);
    assert.equal(failed.body.error, 'Archive failed');
  } finally {
    global.fetch = previousFetch;
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
});
