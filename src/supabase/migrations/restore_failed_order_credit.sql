-- Run after add_referrals.sql. Safely close failed/cancelled payment orders.
BEGIN;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS close_reason TEXT
  CHECK (close_reason IN ('FAILED', 'CANCELLED'));

-- Called only by the server after checking Cashfree. Both stages lock the same
-- order as fulfillment; a racing successful payment always keeps its credit.
CREATE OR REPLACE FUNCTION public.close_purchase_order(
  cashfree_order_id TEXT, reason TEXT, provider_closed BOOLEAN
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.purchase_orders%ROWTYPE;
BEGIN
  IF reason IS NULL OR reason NOT IN ('FAILED', 'CANCELLED') THEN RAISE EXCEPTION 'Invalid close reason'; END IF;
  SELECT * INTO o FROM purchase_orders WHERE order_id = cashfree_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF o.status = 'PAID' OR o.credit_released THEN RETURN to_jsonb(o); END IF;
  UPDATE purchase_orders SET
    close_reason = coalesce(o.close_reason, reason),
    status = CASE WHEN provider_closed IS TRUE THEN coalesce(o.close_reason, reason) ELSE 'CANCELLING' END,
    credit_released = provider_closed IS TRUE
  WHERE id = o.id RETURNING * INTO o;
  RETURN to_jsonb(o);
END; $$;
REVOKE ALL ON FUNCTION public.close_purchase_order(TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_purchase_order(TEXT, TEXT, BOOLEAN) TO service_role;

-- Never grant access to an order whose credit was already returned, and never
-- return credit from a completed paid purchase via the failed-order pathway.
CREATE OR REPLACE FUNCTION public.guard_paid_order_credit()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'PAID' AND NEW.credit_released THEN
    RAISE EXCEPTION 'Cannot fulfill an order with returned credit';
  END IF;
  IF OLD.status = 'PAID' AND NEW.credit_released THEN
    RAISE EXCEPTION 'Cannot return paid order credit through cancellation';
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_paid_order_credit() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_paid_order_credit ON public.purchase_orders;
CREATE TRIGGER guard_paid_order_credit BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_paid_order_credit();
NOTIFY pgrst, 'reload schema';
COMMIT;
