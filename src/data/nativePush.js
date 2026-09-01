import { Capacitor } from '@capacitor/core';
import { apiUrl } from './api';

// Register this device for native push (FCM token) via Capacitor.
// This is a browser-web-workaround: Capacitor PushNotifications only runs in a
// real native app, not in a plain desktop/web browser.
export function isNativePlatform() {
  return Capacitor.isNativePlatform();
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
  } catch {
    // old Android / unsupported — proceed and let registration attempt run
  }

  if (permissionStatus.receive !== 'granted') return null;

  await PushNotifications.register();

  const { supabase } = await import('../supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  const token = session?.access_token;

  return new Promise((resolve) => {
    const cleanup = () => {
      PushNotifications.removeAllListeners();
      resolve(true);
    };

    PushNotifications.addListener('registration', async (tokenData) => {
      const fcmToken = tokenData?.value;
      if (!userId || !fcmToken || !token) {
        cleanup();
        return;
      }
      try {
        await fetch(apiUrl('/api/save-subscription'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ userId, subscription: fcmToken, tokenType: 'fcm' }),
        });
      } catch {
        // ignore
      }
      cleanup();
    });

    PushNotifications.addListener('registrationError', () => {
      cleanup();
    });
  });
}
