import { apiUrl } from './api';

let _registration = null;

function log(...args) {
  try { console.error('[Push]', ...args); } catch { /* ignore */ }
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    log('Unsupported: no serviceWorker or PushManager');
    return null;
  }

  try {
    _registration = await navigator.serviceWorker.register('/service-worker.js');
    return _registration;
  } catch (e) {
    log('SW register failed:', e);
    return null;
  }
}

export async function getVapidPublicKey() {
  try {
    const res = await fetch(apiUrl('/api/vapid-public-key'));
    const data = await res.json();
    return data.publicKey;
  } catch (e) {
    log('getVapidPublicKey failed:', e);
    return null;
  }
}

async function saveSubscription(subscription) {
  const { data: { session } } = await import('../supabase/client.js').then(m => m.supabase.auth.getSession());
  const userId = session?.user?.id;
  if (!userId) {
    log('saveSubscription aborted: no session / not logged in');
    return false;
  }
  const res = await fetch(apiUrl('/api/save-subscription'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ userId, subscription }),
  });
  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    log('saveSubscription POST failed:', res.status, body);
    return false;
  }
  return true;
}

export async function subscribeToPush(registration) {
  try {
    const reg = registration || _registration;
    if (!reg) {
      log('subscribe aborted: no registration');
      return null;
    }

    const publicKey = await getVapidPublicKey();
    if (!publicKey) {
      log('subscribe aborted: no VAPID public key');
      return null;
    }

    // If an existing subscription is active, just re-save it (idempotent).
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await saveSubscription(existing);
      return existing;
    }

    // The push service can transiently fail ("Registration failed - push service
    // error"). Retry a couple times before giving up.
    let subscription = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        });
        break;
      } catch (e) {
        log('subscribe attempt', attempt, 'failed:', e?.name, e?.message);
        if (attempt === 3 || (e?.name === 'NotAllowedError' || e?.name === 'SecurityError')) {
          throw e;
        }
        await new Promise(r => setTimeout(r, 800 * attempt));
      }
    }

    await saveSubscription(subscription);
    return subscription;
  } catch (e) {
    log('subscribe error:', e);
    return null;
  }
}

export async function unsubscribeFromPush() {
  try {
    const reg = _registration || await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
  } catch {
    // ignore
  }
}
