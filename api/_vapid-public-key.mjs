import { setCors } from './_auth.mjs';

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(500).json({ error: 'VAPID_PUBLIC_KEY not configured' });
  }
  res.status(200).json({ publicKey });
}
