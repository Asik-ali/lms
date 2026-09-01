import webpush from 'web-push';
import { createServiceClient, requireAdmin, setCors } from './_auth.mjs';

let firebaseMessaging = null;
let fcmInitError = null;

// Lazily initialise Firebase Admin for FCM (native Android/iOS push). Guarded
// with a global flag because firebase-admin caches and throws if initialised
// twice across cold-start invocations.
async function getFcmApp() {
  if (!process.env.FCM_CLIENT_EMAIL || !process.env.FCM_PRIVATE_KEY) {
    fcmInitError = 'FCM_CLIENT_EMAIL or FCM_PRIVATE_KEY missing';
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
    fcmInitError = null;
    return firebaseMessaging;
  } catch (e) {
    fcmInitError = e?.message || String(e);
    return null;
  }
}

export default async function handler(req, res) {
  if (setCors(req, res)) return;

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

    const webRows = rows.filter(r => r.token_type !== 'fcm');
    const fcmRows = rows.filter(r => r.token_type === 'fcm');
    const webSubs = webRows.map(r => ({ id: r.id, user_id: r.user_id, sub: r.subscription }));
    const fcmTokens = fcmRows.map(r => ({ id: r.id, user_id: r.user_id, token: r.subscription }));

    let webSent = 0;
    let fcmSent = 0;
    const staleIds = [];

    // 1) Web push (browser).
    const webConfigured = !!(vapidPublicKey && vapidPrivateKey);
    if (webSubs.length > 0 && webConfigured) {
      const payload = JSON.stringify({ title: subject, body: message });
      const results = await Promise.allSettled(
        webSubs.map(({ sub }) => {
          let parsed = sub;
          if (typeof sub === 'string') {
            try { parsed = JSON.parse(sub); } catch { return null; }
          }
          if (!parsed || !parsed.endpoint || !parsed.keys) return null;
          return webpush.sendNotification(parsed, payload);
        })
      );
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          webSent++;
        } else if (r.status === 'rejected') {
          const err = r.reason;
          const status = err?.statusCode || err?.status;
          if (status === 404 || status === 410) {
            staleIds.push(webSubs[i].id);
          }
        }
      });
    }

    // 2) Native FCM push (Android/iOS).
    const fcmConfigured = await getFcmApp() !== null;
    if (fcmTokens.length > 0) {
      const messaging = fcmConfigured ? await getFcmApp() : null;
      if (messaging) {
        const fcmResults = await Promise.allSettled(
          fcmTokens.map(({ token }) =>
            messaging.send({
              token,
              notification: { title: subject, body: message },
              data: { title: subject, body: message },
            })
          )
        );
        fcmResults.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            fcmSent++;
          } else if (r.status === 'rejected') {
            const err = r.reason;
            const code = err?.code || '';
            if (code.includes('NOT_FOUND') || code.includes('UNREGISTERED') || code.includes('INVALID_ARGUMENT')) {
              staleIds.push(fcmTokens[i].id);
            }
          }
        });
      }
    }

    // Remove stale / dead subscriptions so future sends aren't polluted.
    if (staleIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', staleIds);
    }

    const total = rows.length;
    const sent = webSent + fcmSent;

    return res.status(200).json({
      success: true,
      sent,
      total,
      web: webSent,
      fcm: fcmSent,
      webConfigured,
      fcmConfigured,
      fcmInitError,
      staleRemoved: staleIds.length,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to send push notifications' });
  }
}
