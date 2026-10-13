-- Run after add_cart_checkout.sql. Permanently remove plans while keeping payment records.
BEGIN;
CREATE OR REPLACE FUNCTION public.delete_sales_plan(target_plan_id BIGINT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE selected_plan public.sales_plans%ROWTYPE; content_snapshot JSONB;
BEGIN
  -- Serialize edits and new checkouts, while allowing in-flight fulfillment FK checks.
  SELECT * INTO selected_plan FROM sales_plans WHERE id = target_plan_id FOR NO KEY UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('item_type', item_type, 'item_id', item_id)), '[]'::JSONB)
    INTO content_snapshot FROM sales_plan_items WHERE plan_id = target_plan_id;
  -- Legacy single-plan orders need snapshots before their plan reference is removed.
  UPDATE purchase_orders SET
    cart_plans = coalesce(cart_plans, jsonb_build_array(jsonb_build_object(
      'id', selected_plan.id, 'name', selected_plan.name, 'price', selected_plan.price))),
    access_items = coalesce(access_items, content_snapshot),
    plan_id = NULL
  WHERE plan_id = target_plan_id;
  UPDATE purchases SET plan_id = NULL WHERE plan_id = target_plan_id;
  DELETE FROM sales_plans WHERE id = target_plan_id;
END; $$;
REVOKE ALL ON FUNCTION public.delete_sales_plan(BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_sales_plan(BIGINT) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
