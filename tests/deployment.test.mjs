import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import pushHandler from '../api/send-push.mjs';

test('deployment stays within the Hobby function limit and preserves the public key URL', async () => {
  const files = await readdir(new URL('../api/', import.meta.url));
  assert.ok(files.filter(file => file.endsWith('.mjs') && !file.startsWith('_')).length <= 12);
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.ok(config.rewrites.some(rule => rule.source === '/api/vapid-public-key' && rule.destination === '/api/send-push?operation=vapid-public-key'));
});

test('rewritten public key requests dispatch without requiring admin credentials', async () => {
  const previous = process.env.VAPID_PUBLIC_KEY;
  process.env.VAPID_PUBLIC_KEY = 'test-public-key';
  const response = {
    setHeader() {},
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
  try {
    await pushHandler({ method: 'GET', headers: {}, query: { operation: 'vapid-public-key' } }, response);
    assert.equal(response.code, 200);
    assert.deepEqual(response.body, { publicKey: 'test-public-key' });
  } finally {
    if (previous === undefined) delete process.env.VAPID_PUBLIC_KEY;
    else process.env.VAPID_PUBLIC_KEY = previous;
  }
});
