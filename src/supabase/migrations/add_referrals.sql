-- Run after add_cart_checkout.sql and allow_permanent_plan_delete.sql.
BEGIN;
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  reward_amount NUMERIC(10,2) NOT NULL CHECK (reward_amount >= 0)
);
INSERT INTO public.referral_settings VALUES (1, 100) ON CONFLICT DO NOTHING;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.referral_codes (
  student_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[A-F0-9]{12}$')
);
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signups ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.referrals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  qualified_at TIMESTAMPTZ,
  qualifying_order_id TEXT UNIQUE,
  reward_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (reward_amount >= 0),
  reward_status TEXT NOT NULL DEFAULT 'pending' CHECK (reward_status IN ('pending', 'credited')),
  CHECK (referrer_id <> referred_id)
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals(referrer_id, created_at DESC);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
-- All referral writes and reads go through authenticated server endpoints.
REVOKE ALL ON public.referral_codes, public.referrals, public.referral_settings FROM anon, authenticated;
GRANT ALL ON public.referral_codes, public.referrals, public.referral_settings TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.referrals_id_seq TO service_role;

ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS credit_applied NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (credit_applied >= 0);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS credit_released BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.referral_credit_balance(buyer_id UUID)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT greatest(0,
    coalesce((SELECT sum(reward_amount) FROM referrals WHERE referrer_id = buyer_id AND reward_status = 'credited'),0)
    - coalesce((SELECT sum(credit_applied) FROM purchase_orders WHERE student_id = buyer_id AND NOT credit_released),0));
$$;
REVOKE ALL ON FUNCTION public.referral_credit_balance(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.referral_credit_balance(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.reward_first_referral_purchase()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.granted IS NOT TRUE OR NEW.amount <= 0 THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM purchases WHERE student_id = NEW.student_id AND granted AND order_id <> NEW.order_id) THEN RETURN NEW; END IF;
  -- The referred_id uniqueness and conditional update serialize retries and concurrent purchases.
  UPDATE referrals SET qualified_at = now(), qualifying_order_id = NEW.order_id,
    reward_amount = (SELECT reward_amount FROM referral_settings WHERE id = 1), reward_status = 'credited'
  WHERE referred_id = NEW.student_id AND qualified_at IS NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = referrals.referrer_id AND role = 'student' AND lower(coalesce(status,'')) <> 'suspended');
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.reward_first_referral_purchase() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS reward_first_referral_purchase ON public.purchases;
CREATE TRIGGER reward_first_referral_purchase AFTER INSERT OR UPDATE OF granted ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.reward_first_referral_purchase();

-- Reuse existing cart validation and snapshot logic. Reserve credit under a per-student lock.
CREATE OR REPLACE FUNCTION public.create_purchase_cart_with_credit(
  cashfree_order_id TEXT, buyer_id UUID, selected_plan_ids BIGINT[], use_credit BOOLEAN
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE saved JSONB; applied NUMERIC := 0; available NUMERIC;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(buyer_id::TEXT, 0));
  saved := public.create_purchase_cart(cashfree_order_id, buyer_id, selected_plan_ids);
  IF use_credit THEN
    available := public.referral_credit_balance(buyer_id);
    -- Keep at least INR 1 payable through Cashfree; excess credit stays available.
    applied := least(available, greatest(0, (saved->>'amount')::NUMERIC - 1));
    UPDATE purchase_orders SET amount = amount - applied, credit_applied = applied
      WHERE id = (saved->>'id')::BIGINT;
  END IF;
  RETURN saved || jsonb_build_object('credit_applied', applied, 'amount', (saved->>'amount')::NUMERIC - applied);
END; $$;
REVOKE ALL ON FUNCTION public.create_purchase_cart_with_credit(TEXT, UUID, BIGINT[], BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_purchase_cart_with_credit(TEXT, UUID, BIGINT[], BOOLEAN) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
