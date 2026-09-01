import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker, subscribeToPush } from './data/pushNotifications.js'
import { isNativePlatform, registerNativePush } from './data/nativePush.js'

async function waitForSession() {
  const { supabase } = await import('./supabase/client.js');
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session;

  // Not signed in yet — wait for Supabase to restore or the user to log in.
  return new Promise((resolve) => {
    let done = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s?.user && !done) {
        done = true;
        subscription.unsubscribe();
        resolve(s);
      }
    });
    // Safety timeout so we don't wait forever on a logged-out visitor.
    setTimeout(() => {
      if (!done) {
        done = true;
        subscription.unsubscribe();
        resolve(null);
      }
    }, 8000);
  });
}

async function setupWebPush() {
  try {
    const session = await waitForSession();
    if (!session?.user) return;

    const registration = await registerServiceWorker();
    if (!registration) return;
    if (Notification.permission === 'granted') {
      await subscribeToPush(registration);
    } else if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeToPush(registration);
      }
    }
  } catch (err) {
    console.error('Push notification setup failed:', err);
  }
}

if (isNativePlatform()) {
  registerNativePush().catch(err => console.error('Native push setup failed:', err));
} else {
  setupWebPush();

  // Re-try subscription when user logs in (auth state change) or tab regains focus.
  import('./supabase/client.js').then(({ supabase }) => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') setupWebPush();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') setupWebPush();
  });
}

createRoot(document.getElementById('root')).render(<App />)
