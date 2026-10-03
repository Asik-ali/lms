import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyWebhookSignature(rawBody, timestamp, signature, secret) {
  if (!secret || typeof timestamp !== 'string' || typeof signature !== 'string') return false;
  const expected = createHmac('sha256', secret).update(timestamp).update(rawBody).digest('base64');
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

export async function readRawBody(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody);
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.from(chunk);
    size += bytes.length;
    if (size > 1024 * 1024) throw new Error('Webhook body is too large');
    chunks.push(bytes);
  }
  if (!chunks.length) throw new Error('Raw webhook body is unavailable');
  return Buffer.concat(chunks);
}
