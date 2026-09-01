import { createServiceClient, getBearerToken } from './_auth.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServiceClient();

  try {
    const { userId, subscription, tokenType = 'web' } = req.body;
    const token_type = tokenType === 'fcm' ? 'fcm' : 'web';

    if (!userId || !subscription) {
      return res.status(400).json({ error: 'Missing userId or subscription' });
    }

    // Only allow a user to save their own subscription (or an admin on their behalf)
    const token = getBearerToken(req);
    let authorized = false;
    if (token) {
      const { data: user, error } = await supabase.auth.getUser(token);
      if (!error && user?.user) {
        if (user.user.id === userId) authorized = true;
        else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.user.id)
            .maybeSingle();
          if (profile?.role === 'admin') authorized = true;
        }
      }
    }
    if (!authorized) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      { user_id: userId, subscription, token_type },
      { onConflict: 'user_id,token_type' }
    );

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to save subscription' });
  }
}
