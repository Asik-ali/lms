import { apiUrl } from './api';

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    return registration;
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
    const publicKey = await getVapidPublicKey();
    if (!publicKey) return null;

    const subscription = await registration.pushManager.subscribe({
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
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
  } catch {
    // ignore
  }
}
