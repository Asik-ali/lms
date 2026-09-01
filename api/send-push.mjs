import webpush from 'web-push';
import { createServiceClient, requireAdmin } from './_auth.mjs';

let firebaseMessaging = null;

// Lazily initialise Firebase Admin for FCM (native Android/iOS push). Guarded
// with a global flag because firebase-admin caches and throws if initialised
// twice across cold-start invocations.
async function getFcmApp() {
  if (!process.env.FCM_CLIENT_EMAIL || !process.env.FCM_PRIVATE_KEY) {
    return null;
  }
  if (firebaseMessaging) return firebaseMessaging;
  try {
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getMessaging } = await import('firebase-admin/messaging');
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.FCM_PROJECT_ID || null,
          clientEmail: process.env.FCM_CLIENT_EMAIL,
          privateKey: (process.env.FCM_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
      });
    }
    firebaseMessaging = getMessaging();
    return firebaseMessaging;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServiceClient();

  const vapidPublicKey = (process.env.VAPID_PUBLIC_KEY || '').trim();
  const vapidPrivateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();

  try {
    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails('mailto:admin@lms.com', vapidPublicKey.trim(), vapidPrivateKey.trim());
    }
  } catch (err) {
    return res.status(500).json({ error: 'Invalid VAPID key configuration: ' + err.message });
  }

  try {
    const allowed = await requireAdmin(req, res, supabase);
    if (!allowed) return;

    const { message, subject, recipient } = req.body;

    if (!message || !subject) {
      return res.status(400).json({ error: 'Missing subject or message' });
    }

    // Load subscriptions, separating web-push subscriptions from FCM tokens.
    let rows = [];
    if (recipient === 'all_students') {
      const { data } = await supabase.from('profiles').select('id').eq('role', 'student');
      const userIds = data?.map(p => p.id) || [];
      if (userIds.length) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('subscription, token_type')
          .in('user_id', userIds);
        rows = subs || [];
      }
    } else if (recipient === 'all_instructors') {
      const { data } = await supabase.from('profiles').select('id').eq('role', 'instructor');
      const userIds = data?.map(p => p.id) || [];
      if (userIds.length) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('subscription, token_type')
          .in('user_id', userIds);
        rows = subs || [];
      }
    } else {
      const { data } = await supabase.from('push_subscriptions').select('subscription, token_type');
      rows = data || [];
    }

    const webSubs = rows.filter(r => r.token_type !== 'fcm').map(r => r.subscription);
    const fcmTokens = rows.filter(r => r.token_type === 'fcm').map(r => r.subscription);

    let webSent = 0;
    let fcmSent = 0;

    // 1) Web push (browser).
    if (webSubs.length > 0 && vapidPublicKey && vapidPrivateKey) {
      const payload = JSON.stringify({ title: subject, body: message });
      const results = await Promise.allSettled(
        webSubs.map(sub => {
          let parsed = sub;
          if (typeof sub === 'string') {
            try { parsed = JSON.parse(sub); } catch { return null; }
          }
          if (!parsed || !parsed.endpoint || !parsed.keys) return null;
          try { return webpush.sendNotification(parsed, payload); } catch { return null; }
        })
      );
      webSent = results.filter(r => r.status === 'fulfilled' && r.value).length;
    }

    // 2) Native FCM push (Android/iOS).
    if (fcmTokens.length > 0) {
      const messaging = await getFcmApp();
      if (messaging) {
        const fcmResults = await Promise.allSettled(
          fcmTokens.map(token =>
            messaging.send({
              token,
              notification: { title: subject, body: message },
              data: { title: subject, body: message },
            })
          )
        );
        fcmSent = fcmResults.filter(r => r.status === 'fulfilled').length;
      }
    }

    const total = rows.length;
    const sent = webSent + fcmSent;

    return res.status(200).json({ success: true, sent, total, web: webSent, fcm: fcmSent });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to send push notifications' });
  }
}
