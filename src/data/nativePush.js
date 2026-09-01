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
    return null;
  }

  const { supabase } = await import('../supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  const token = session?.access_token;
  if (!userId || !token) {
    log('registerNativePush aborted: not logged in');
  }

  try {
    await PushNotifications.register();
  } catch (e) {
    log('PushNotifications.register error:', e);
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
      } catch (e) {
        log('save FCM token error:', e);
      }
      cleanup();
    });

    PushNotifications.addListener('registrationError', (err) => {
      log('registration error:', err);
      cleanup();
    });
  });
}
