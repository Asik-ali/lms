import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { recoverChunkLoad } from '../src/data/chunkRecovery.js';

test('stale module recovery reloads once, preserves session, and avoids offline loops', () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  let reloads = 0;
  const options = { storage, location: { reload: () => reloads++ }, online: true, now: 100000 };
  const error = new TypeError('Failed to fetch dynamically imported module: /assets/old.js');
  assert.equal(recoverChunkLoad(error, options), true);
  assert.equal(recoverChunkLoad(error, options), false);
  assert.equal(recoverChunkLoad(error, { ...options, online: false, now: 200000 }), false);
  assert.equal(recoverChunkLoad(new Error('Render failed'), options), false);
  assert.equal(reloads, 1);
});

test('SPA fallback excludes asset requests and HTML is not cached', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const source = config.rewrites.find(rule => rule.destination === '/index.html').source;
  const matcher = new RegExp(`^${source}$`);
  assert.equal(matcher.test('/student/courses/1'), true);
  for (const path of ['/assets/StudentDashboard-old.js', '/api/order-status', '/service-worker.js']) assert.equal(matcher.test(path), false);
  assert.ok(config.headers.some(rule => rule.source === source && rule.headers.some(header => header.key === 'Cache-Control' && header.value === 'no-store')));
});
