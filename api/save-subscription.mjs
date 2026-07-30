import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { userId, subscription } = req.body;

    if (!userId || !subscription) {
      return res.status(400).json({ error: 'Missing userId or subscription' });
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      { user_id: userId, subscription },
      { onConflict: 'user_id' }
    );

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to save subscription' });
  }
}
