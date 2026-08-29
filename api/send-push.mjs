import webpush from 'web-push';
import { createServiceClient, requireAdmin } from './_auth.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServiceClient();

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublicKey || !vapidPrivateKey) {
    return res.status(500).json({ error: 'VAPID keys not configured' });
  }
  webpush.setVapidDetails('mailto:admin@lms.com', vapidPublicKey, vapidPrivateKey);

  try {
    const allowed = await requireAdmin(req, res, supabase);
    if (!allowed) return;

    const { message, subject, recipient } = req.body;

    if (!message || !subject) {
      return res.status(400).json({ error: 'Missing subject or message' });
    }

    let subscriptions = [];

    if (recipient === 'all_students') {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student');
      const userIds = data?.map(p => p.id) || [];
      if (userIds.length) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .in('user_id', userIds);
        subscriptions = subs?.map(s => s.subscription) || [];
      }
    } else if (recipient === 'all_instructors') {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'instructor');
      const userIds = data?.map(p => p.id) || [];
      if (userIds.length) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .in('user_id', userIds);
        subscriptions = subs?.map(s => s.subscription) || [];
      }
    } else {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('subscription');
      subscriptions = data?.map(s => s.subscription) || [];
    }

    if (subscriptions.length === 0) {
      return res.status(200).json({ success: true, sent: 0, message: 'No subscribers' });
    }

    const payload = JSON.stringify({ title: subject, body: message });

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(sub, payload).catch(() => {})
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;

    return res.status(200).json({ success: true, sent, total: subscriptions.length });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to send push notifications' });
  }
}
