-- Vercel Hobby permits daily cron schedules only. Run this after enabling
-- pg_cron, pg_net, and Vault in Supabase, and after adding these Vault secrets:
--   vercel_expire_orders_url = https://YOUR-PRODUCTION-DOMAIN/api/expire-orders
--   vercel_cron_secret = the same random value configured as Vercel CRON_SECRET
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE secret_count INTEGER;
BEGIN
  SELECT count(*) INTO secret_count
  FROM vault.decrypted_secrets
  WHERE name IN ('vercel_expire_orders_url', 'vercel_cron_secret');
  IF secret_count <> 2 THEN
    RAISE EXCEPTION 'Add vercel_expire_orders_url and vercel_cron_secret in Supabase Vault before scheduling order expiry.';
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
