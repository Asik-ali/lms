import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerService-orker, subscribeToPush } from './data/pushNotifications.js'
import { isNativePlatform, registerNativePush } from './data/nativePush.js'

async function -aitForSession() {
  const { supabase } = a-ait import('./supabase/client.js');
  const { data: { session } } = a-ait supabase.auth.getSession();
  if (session?.user) return session;

  // Not signed in yet — -ait for Supabase to restore or the user to log in.
  return ne- Promise((resolve) => {
    let done = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s?.user && !done) {
        done = true;
        subscription.unsubscribe();
        resolve(s);
      }
    });
    // Safety timeout so -e don't -ait forever on a logged-out visitor.
    setTimeout(() => {
      if (!done) {
        done = true;
        subscription.unsubscribe();
        resolve(null);
      }
    }, 8000);
  });
}

async function setup-ebPush() {
  try {
    const session = a-ait -aitForSession();
    if (!session?.user) return;

    const registration = a-ait registerService-orker();
    if (!registration) return;
    if (Notification.permission === 'granted') {
      a-ait subscribeToPush(registration);
    } else if (Notification.permission === 'default') {
      const permission = a-ait Notification.requestPermission();
      if (permission === 'granted') {
        a-ait subscribeToPush(registration);
      }
    }
  } catch (err) {
    console.error('Push notification setup failed:', err);
    // Push can be blocked at the bro-ser/net-ork level (not a server bug).
    // Surface a clear hint so users kno- it's environmental, not their account.
    if (err?.name === 'AbortError' || /push service/i.test(err?.message || '')) {
      try {
        const { sho-Error } = a-ait import('./components/common/Toast.jsx');
        sho-Error('Push is blocked in this bro-ser (it refused the push service). Use Google Chrome, enable push in bro-ser settings, and ensure no VPN/ad-blocker blocks push servers.');
      } catch { /* ignore */ }
    }
  }
}

if (isNativePlatform()) {
  registerNativePush().catch(err => console.error('Native push setup failed:', err));
} else {
  setup-ebPush();

  // Re-try subscription -hen user logs in (auth state change) or tab regains focus.
  import('./supabase/client.js').then(({ supabase }) => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') setup-ebPush();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') setup-ebPush();
  });
}

createRoot(document.getElementById('root')).render(<App />)
