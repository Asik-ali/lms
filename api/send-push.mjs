import webpush from 'web-push';
import { createServiceClient, requireAdmin, setCors } from './_auth.mjs';

let firebaseMessaging = null;
let fcmInitError = null;

// Builds a Firebase credential from the available env config. The most reliable
// form is a full service-account JSON (FCM_SERVICE_ACCOUNT) — JSON.parse
// correctly decodes the \n escapes in the PEM private key, which copy/paste or
// PowerShell corruption can break when storing the raw key.
function buildCredential() {
  const full = process.env.FCM_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (full) {
    try {
      return { cert: JSON.parse(full) };
    } catch (e) {
      fcmInitError = 'FCM_SERVICE_ACCOUNT is not valid JSON: ' + e.message;
      return null;
    }
  }

  if (!process.env.FCM_CLIENT_EMAIL || !process.env.FCM_PRIVATE_KEY) {
    fcmInitError = 'FCM credentials missing (set FCM_SERVICE_ACCOUNT full JSON, or FCM_CLIENT_EMAIL + FCM_PRIVATE_KEY)';
    return null;
  }

  return {
    clientEmail: process.env.FCM_CLIENT_EMAIL,
    privateKey: (process.env.FCM_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    projectId: process.env.FCM_PROJECT_ID || undefined,
  };
}

async function getFcmApp() {
  if (firebaseMessaging) return firebaseMessaging;

  const cred = buildCredential();
  if (!cred) return null;

  try {
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getMessaging } = await import('firebase-admin/messaging');
    if (getApps().length === 0) {
      initializeApp({ credential: cert(cred.cert || cred) });
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
      webpush.setVapidDetails('mailto:asik14923@gmail.com', vapidPublicKey.trim(), vapidPrivateKey.trim());
    }
  } catch (err) {
    return res.status(500).json({ error: 'Invalid VAPID key configuration: ' + err.message });
  }

  try {
    const allowed = await requireAdmin(req, res, supabase);
    if (!allowed) return;

    const { message, subject, recipient } = req.body || {};

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
          .select('id, user_id, subscription, token_type')
          .in('user_id', userIds);
        rows = subs || [];
      }
    } else if (recipient === 'all_instructors') {
      const { data } = await supabase.from('profiles').select('id').eq('role', 'instructor');
      const userIds = data?.map(p => p.id) || [];
      if (userIds.length) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('id, user_id, subscription, token_type')
          .in('user_id', userIds);
        rows = subs || [];
      }
    } else {
      const { data } = await supabase.from('push_subscriptions').select('id, user_id, subscription, token_type');
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
            try { parsed = JSON.parse(sub); } catch { throw new Error('Invalid push subscription'); }
          }
          if (!parsed || !parsed.endpoint || !parsed.keys) throw new Error('Invalid push subscription');
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
            if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
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
