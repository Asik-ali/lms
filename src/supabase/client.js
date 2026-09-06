import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
}

const STORAGE_PREFIX = 'sb';
const storageKey = (key) => `${STORAGE_PREFIX}-${key}`;

// In the native Capacitor app the WebView's localStorage can be cleared between
// launches, which logs the user out on every start. Persist the Supabase auth
// session through Capacitor Preferences (native storage) so login survives an
// app restart. Falls back to localStorage on the web.
let prefMemory = {};
let prefLoaded = null;

async function loadPreferences() {
  const { keys } = await Preferences.keys();
  for (const k of keys) {
    const { value } = await Preferences.get({ key: k });
    prefMemory[k] = value;
  }
  prefLoaded = true;
}

const nativeStorage = {
  async getItem(key) {
    const k = storageKey(key);
    if (!prefLoaded) await loadPreferences();
    return prefMemory[k] ?? null;
  },
  async setItem(key, value) {
    const k = storageKey(key);
    await Preferences.set({ key: k, value });
    prefMemory[k] = value;
  },
  async removeItem(key) {
    const k = storageKey(key);
    await Preferences.remove({ key: k });
    delete prefMemory[k];
  },
};

const webStorage = {
  getItem(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem(key, value) {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  },
  removeItem(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

const isNative = Capacitor.isNativePlatform?.() || (typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.());

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: isNative ? nativeStorage : webStorage,
    storageKey: storageKey('lms-auth-token'),
  },
});