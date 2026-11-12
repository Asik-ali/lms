-- Apply after add_cart_checkout.sql and add_referrals.sql, before deploying the
-- checkout API. Prevent a student from buying content they already own or
-- content reserved by another still-open payment order.
BEGIN;

CREATE OR REPLACE FUNCTION public.create_purchase_cart(cashfree_order_id TEXT, buyer_id UUID, selected_plan_ids BIGINT[])
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total NUMERIC;
  plan_count INTEGER;
  names TEXT;
  snapshot JSONB;
  items_snapshot JSONB;
  saved purchase_orders%ROWTYPE;
  buyer profiles%ROWTYPE;
BEGIN
  IF cardinality(selected_plan_ids) IS NULL OR cardinality(selected_plan_ids) NOT BETWEEN 1 AND 50
    OR cardinality(selected_plan_ids) <> (SELECT count(DISTINCT id) FROM unnest(selected_plan_ids) id)
  THEN RAISE EXCEPTION 'Select unique plans for checkout'; END IF;

  -- Serialize purchase creation for this student, then read current access.
  SELECT * INTO buyer FROM profiles WHERE id = buyer_id FOR UPDATE;
  IF NOT FOUND OR buyer.role <> 'student' OR lower(coalesce(buyer.status,'')) = 'suspended'
  THEN RAISE EXCEPTION 'Student not authorized'; END IF;

  -- Locks serialize checkout snapshots with admin edits.
  PERFORM id FROM sales_plans WHERE id = ANY(selected_plan_ids) ORDER BY id FOR SHARE;
  SELECT count(*), sum(price), string_agg(name, ', ' ORDER BY id),
    jsonb_agg(jsonb_build_object('id',id,'name',name,'price',price) ORDER BY id)
    INTO plan_count, total, names, snapshot FROM sales_plans
    WHERE id = ANY(selected_plan_ids) AND status = 'active' AND price > 0;
  IF plan_count <> cardinality(selected_plan_ids) THEN RAISE EXCEPTION 'A cart item is unavailable. Refresh the shop'; END IF;
  IF EXISTS(SELECT 1 FROM unnest(selected_plan_ids) AS selected(plan_id_value) WHERE NOT EXISTS(
    SELECT 1 FROM sales_plan_items WHERE plan_id = selected.plan_id_value)) THEN RAISE EXCEPTION 'A selected plan has no content'; END IF;

  SELECT jsonb_agg(to_jsonb(content)) INTO items_snapshot FROM (
    SELECT DISTINCT i.item_type, i.item_id FROM sales_plan_items i
    WHERE i.plan_id = ANY(selected_plan_ids)
  ) content;
  IF EXISTS(SELECT 1 FROM jsonb_to_recordset(items_snapshot) AS i(item_type TEXT, item_id BIGINT)
    WHERE (i.item_type = 'course' AND NOT EXISTS(SELECT 1 FROM courses WHERE id = i.item_id))
       OR (i.item_type = 'test_series' AND NOT EXISTS(SELECT 1 FROM test_series WHERE id = i.item_id))
       OR i.item_type NOT IN ('course','test_series')) THEN RAISE EXCEPTION 'Selected content is unavailable'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_to_recordset(items_snapshot) AS i(item_type TEXT, item_id BIGINT)
    WHERE NOT ((i.item_type = 'course' AND EXISTS (
      SELECT 1 FROM courses c
      JOIN unnest(string_to_array(coalesce(buyer.course,''), ',')) AS access_name(value) ON lower(trim(access_name.value)) = lower(trim(c.title))
      WHERE c.id = i.item_id
    )) OR (i.item_type = 'test_series' AND EXISTS (
      SELECT 1 FROM test_series t
      JOIN unnest(string_to_array(coalesce(buyer.test_series_access,''), ',')) AS access_name(value) ON lower(trim(access_name.value)) = lower(trim(t.name))
      WHERE t.id = i.item_id
    )))
  ) THEN RAISE EXCEPTION 'You already own all content in this plan.'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_to_recordset(items_snapshot) AS requested_item(item_type TEXT, item_id BIGINT)
    WHERE NOT EXISTS (
      SELECT 1 FROM purchase_orders po
      CROSS JOIN LATERAL jsonb_to_recordset(coalesce(po.access_items, '[]'::JSONB)) AS existing(item_type TEXT, item_id BIGINT)
      WHERE po.student_id = buyer_id AND po.status NOT IN ('PAID','FAILED','CANCELLED','EXPIRED')
        AND existing.item_type = requested_item.item_type AND existing.item_id = requested_item.item_id
    )
  ) THEN RAISE EXCEPTION 'A payment is already in progress for all content in this plan. Check its order status first.'; END IF;

  INSERT INTO purchase_orders(order_id, plan_id, student_id, amount, status, cart_plans, access_items)
    VALUES(cashfree_order_id, CASE WHEN plan_count = 1 THEN selected_plan_ids[1] ELSE NULL END,
      buyer_id, total, 'PENDING', snapshot, items_snapshot) RETURNING * INTO saved;
  RETURN jsonb_build_object('id',saved.id,'amount',total,'plan_name',names,'plans',snapshot);
END; $$;

REVOKE ALL ON FUNCTION public.create_purchase_cart(TEXT, UUID, BIGINT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_purchase_cart(TEXT, UUID, BIGINT[]) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
