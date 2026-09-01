import { apiUrl } from './api';

let _registration = null;

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    _registration = await navigator.serviceWorker.register('/service-worker.js');
    return _registration;
  } catch {
    return null;
  }
}

export async function getVapidPublicKey() {
  try {
    const res = await fetch(apiUrl('/api/vapid-public-key'));
    const data = await res.json();
    return data.publicKey;
  } catch {
    return null;
  }
}

export async function subscribeToPush(registration) {
  try {
    const reg = registration || _registration;
    if (!reg) return null;

    const publicKey = await getVapidPublicKey();
    if (!publicKey) return null;

    // If an existing subscription is active, just re-save it (idempotent).
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      const { data: { session } } = await import('../supabase/client.js').then(m => m.supabase.auth.getSession());
      if (!session?.user?.id) return null;

      await fetch(apiUrl('/api/save-subscription'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: session.user.id, subscription: existing }),
      });
      return existing;
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });

    const { data: { session } } = await import('../supabase/client.js').then(m => m.supabase.auth.getSession());
    const userId = session?.user?.id;
    if (!userId) return null;

    const res = await fetch(apiUrl('/api/save-subscription'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId, subscription }),
    });

    if (!res.ok) return null;
    return subscription;
  } catch {
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
