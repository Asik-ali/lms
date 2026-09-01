-- Add token_type to push_subscriptions so a user can have one web push
-- subscription AND one native FCM token. Also drop the old unique(user_id)
-- constraint so the two can coexist.
ALTER TABLE push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_key;

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS token_type TEXT NOT NULL DEFAULT 'web';

-- Ensure uniqueness per (user_id, token_type)
ALTER TABLE push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_token_type_key;

ALTER TABLE push_subscriptions
  ADD CONSTRAINT push_subscriptions_user_id_token_type_key UNIQUE (user_id, token_type);

NOTIFY pgrst, 'reload schema';
