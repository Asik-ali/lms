import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'https://localhost',
  'capacitor://localhost',
  'http://localhost',
  process.env.VITE_SITE_URL,
].filter(Boolean);

// For Capacitor native apps the WebView origin is https://localhost, which is
// cross-origin to the deployed site. Without CORS headers the WebView blocks
// serverless API calls with "Failed to fetch". Apply this to any API route the
// native app calls.
export function setCors(req, res) {
  const origin = req.headers?.origin || '';
  const allowed = origin && (ALLOWED_ORIGINS.includes(origin) || /^https:\/\/asiklms\.vercel\.app$/.test(origin));
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : process.env.VITE_SITE_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, X-Client-Info');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function createServiceClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, serviceKey);
}

export function getBearerToken(req) {
  return (req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
}

export async function isAdmin(req, supabase) {
  const token = getBearerToken(req);
  if (!token) return false;
  const { data: user, error } = await supabase.auth.getUser(token);
  if (error || !user?.user) return false;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.user.id)
    .maybeSingle();
  return profile?.role === 'admin';
}

export async function requireAdmin(req, res, supabase) {
  const admin = await isAdmin(req, supabase);
  if (!admin) {
    res.status(401).json({ error: 'Not authorized' });
    return false;
  }
  return true;
}

export async function getAuthedUser(req, supabase) {
  const token = getBearerToken(req);
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, name, email, role, course, test_series_access')
    .eq('id', data.user.id)
    .maybeSingle();
  return profile || null;
}
