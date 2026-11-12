-- First add these two secrets in Supabase Dashboard > Vault > Secrets:
--   vercel_expire_orders_url = https://asiklms.vercel.app/api/expire-orders
--   vercel_cron_secret = the same private value as Vercel Production CRON_SECRET
-- Then run this complete script in Supabase SQL Editor. No secret is embedded here.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  secret_count INTEGER;
BEGIN
  SELECT count(*) INTO secret_count
  FROM vault.decrypted_secrets
  WHERE name IN ('vercel_expire_orders_url', 'vercel_cron_secret')
    AND decrypted_secret IS NOT NULL
    AND decrypted_secret <> '';

  IF secret_count <> 2 THEN
    RAISE EXCEPTION 'In Supabase Dashboard > Vault > Secrets, add vercel_expire_orders_url and vercel_cron_secret first.';
  END IF;

  PERFORM cron.schedule(
    'expire-orders-every-five-minutes',
    '*/5 * * * *',
    $job$
      SELECT net.http_get(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'vercel_expire_orders_url'),
        headers := jsonb_build_object(
          'Authorization',
          'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'vercel_cron_secret')
        )
      );
    $job$
  );
END $$;
COMMIT;
