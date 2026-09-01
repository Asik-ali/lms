import { Capacitor } from '@capacitor/core';
import { apiUrl } from './api';

// Register this device for native push (FCM token) via Capacitor.
// This is a browser-web-workaround: Capacitor PushNotifications only runs in a
// real native app, not in a plain desktop/web browser.
export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

function log(...args) {
  try { console.error('[NativePush]', ...args); } catch { /* ignore */ }
}

async function toast(message, type = 'error') {
  try {
    const { showError, showSuccess } = await import('../components/common/Toast.jsx');
    const fn = type === 'success' ? showSuccess : showError;
    fn(message);
  } catch { /* ignore */ }
}

export async function registerNativePush() {
  if (!Capacitor.isNativePlatform()) return null;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  // Android 13+ requires the POST_NOTIFICATIONS runtime permission.
  let permissionStatus = { receive: false };
  try {
    permissionStatus = await PushNotifications.checkPermissions();
    if (permissionStatus.receive !== 'granted') {
      permissionStatus = await PushNotifications.requestPermissions();
    }
  } catch (e) {
    log('checkPermissions error:', e);
  }

  if (permissionStatus.receive !== 'granted') {
    log('Permission not granted:', JSON.stringify(permissionStatus));
    toast('Push permission not granted. Enable notifications in app settings to receive push.');
    return null;
  }

  const { supabase } = await import('../supabase/client');
  let session;
  const { data: { session: initial } } = await supabase.auth.getSession();
  if (initial?.user) {
    session = initial;
  } else {
    session = await new Promise((resolve) => {
      let done = false;
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
        if (s?.user && !done) { done = true; subscription.unsubscribe(); resolve(s); }
      });
      setTimeout(() => { if (!done) { done = true; subscription.unsubscribe(); resolve(null); } }, 8000);
    });
  }
  const userId = session?.user?.id;
  const token = session?.access_token;
  if (!userId || !token) {
    log('registerNativePush aborted: not logged in');
    return null;
  }

  try {
    await PushNotifications.register();
  } catch (e) {
    log('PushNotifications.register error:', e);
    toast('Push registration failed: ' + (e?.message || e));
    return null;
  }

  return new Promise((resolve) => {
    let settled = false;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      try { PushNotifications.removeAllListeners(); } catch { /* ignore */ }
      resolve(true);
    };

    PushNotifications.addListener('registration', async (tokenData) => {
      const fcmToken = tokenData?.value;
      log('FCM token received:', fcmToken ? 'yes' : 'no');
      if (!userId || !fcmToken || !token) {
        toast('Push failed: no FCM token generated from Firebase.');
        cleanup();
        return;
      }
      try {
        const res = await fetch(apiUrl('/api/save-subscription'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ userId, subscription: fcmToken, tokenType: 'fcm' }),
        });
        log('save FCM token status:', res.status);
        const body = await res.text().catch(() => '');
        log('save FCM token body:', body);
        if (res.ok) {
          toast('Push notifications enabled for this device.', 'success');
        } else {
          toast('Push save failed: ' + (body || res.status));
        }
      } catch (e) {
        log('save FCM token error:', e);
        toast('Push save error: ' + (e?.message || e));
      }
      cleanup();
    });

    PushNotifications.addListener('registrationError', (err) => {
      log('registration error:', err);
      toast('Push registration error: ' + (err?.message || JSON.stringify(err) || err));
      cleanup();
    });
  });
}
