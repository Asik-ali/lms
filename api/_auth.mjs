import { createClient } from '@supabase/supabase-js';

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
