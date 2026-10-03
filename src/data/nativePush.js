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

// Android 13+ ships runtime notification permission. Ask for it up front (and
// wherever else it is convenient) so every phone surfaces the system prompt
// for the user to allow push notifications.
export async function requestNativePushPermission() {
  if (!Capacitor.isNativePlatform()) return false;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  try {
    let status = await PushNotifications.checkPermissions();
    if (status.receive !== 'granted') {
      status = await PushNotifications.requestPermissions();
    }
    if (status.receive !== 'granted') {
      log('Permission not granted:', JSON.stringify(status));
      toast('Push notifications are disabled. Allow notifications in your phone settings to receive alerts.');
      return false;
    }
    return true;
  } catch (e) {
    log('requestPermissions error:', e);
    return false;
  }
}

export async function registerNativePush() {
  if (registrationInFlight) return registrationInFlight;
  registrationInFlight = registerDevice().finally(() => { registrationInFlight = null; });
  return registrationInFlight;
}

let registrationInFlight = null;

async function registerDevice() {
  if (!Capacitor.isNativePlatform()) return null;

  const granted = await requestNativePushPermission();
  if (!granted) return null;

  const { PushNotifications } = await import('@capacitor/push-notifications');

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

  return new Promise((resolve) => {
    let settled = false;
    const handles = [];
    const timeout = setTimeout(() => cleanup(null), 15000);
    const cleanup = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      handles.forEach(handle => Promise.resolve(handle.remove()).catch(() => {}));
      resolve(result);
    };
    const onRegistration = async (tokenData) => {
      if (settled) return;
      const fcmToken = tokenData?.value;
      log('FCM token received:', fcmToken ? 'yes' : 'no');
      if (!userId || !fcmToken || !token) {
        cleanup(null);
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
          cleanup(true);
        } else {
          toast('Unable to enable notifications. Please try again later.');
          cleanup(null);
        }
      } catch (e) {
        log('save FCM token error:', e);
        toast('Unable to enable notifications. Check your internet connection.');
        cleanup(null);
      }
    };
    const onRegistrationError = (err) => {
      log('registration error:', err);
      toast('Unable to enable notifications. Please try again later.');
      cleanup(null);
    };

    // Attach both listeners before register: Android can emit its token immediately.
    (async () => {
      try {
        for (const [event, listener] of [['registration', onRegistration], ['registrationError', onRegistrationError]]) {
          const handle = await PushNotifications.addListener(event, listener);
          if (settled) { await handle.remove(); return; }
          handles.push(handle);
        }
        await PushNotifications.register();
      } catch (error) {
        log('Push registration failed:', error);
        cleanup(null);
      }
    })();
  });
}
