-- Run after secure_cashfree_fulfillment.sql, before deploying cart checkout.
BEGIN;
ALTER TABLE public.purchase_orders ALTER COLUMN plan_id DROP NOT NULL;
ALTER TABLE public.purchases ALTER COLUMN plan_id DROP NOT NULL;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS cart_plans JSONB;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS access_items JSONB;

-- Save the price and selected content together; failed item validation rolls back everything.
CREATE OR REPLACE FUNCTION public.save_sales_plan(target_plan_id BIGINT, plan_body JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE saved sales_plans%ROWTYPE; item JSONB; item_id_value BIGINT; item_type_value TEXT;
BEGIN
  IF coalesce(trim(plan_body->>'name'), '') = '' THEN RAISE EXCEPTION 'Plan name is required'; END IF;
  IF coalesce(plan_body->>'price', '') = '' OR (plan_body->>'price')::NUMERIC <= 0
     OR (plan_body->>'price')::NUMERIC > 99999999.99
     OR (plan_body->>'price')::NUMERIC <> round((plan_body->>'price')::NUMERIC, 2)
  THEN RAISE EXCEPTION 'Enter a positive price with at most two decimal places'; END IF;
  IF coalesce(plan_body->>'status', 'active') NOT IN ('active', 'inactive') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  IF jsonb_typeof(plan_body->'items') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Select courses or test series'; END IF;
  IF jsonb_array_length(plan_body->'items') = 0 THEN RAISE EXCEPTION 'Select at least one course or test series'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(plan_body->'items') LOOP
    item_type_value := item->>'item_type'; item_id_value := (item->>'item_id')::BIGINT;
    IF item_type_value = 'course' THEN
      IF NOT EXISTS(SELECT 1 FROM courses WHERE id = item_id_value) THEN RAISE EXCEPTION 'Course not found'; END IF;
    ELSIF item_type_value = 'test_series' THEN
      IF NOT EXISTS(SELECT 1 FROM test_series WHERE id = item_id_value) THEN RAISE EXCEPTION 'Test series not found'; END IF;
    ELSE RAISE EXCEPTION 'Invalid item type'; END IF;
  END LOOP;
  IF target_plan_id IS NULL THEN
    INSERT INTO sales_plans(name, description, price, status)
    VALUES(trim(plan_body->>'name'), coalesce(plan_body->>'description',''), (plan_body->>'price')::NUMERIC,
      coalesce(plan_body->>'status','active')) RETURNING * INTO saved;
  ELSE
    UPDATE sales_plans SET name = trim(plan_body->>'name'), description = coalesce(plan_body->>'description',''),
      price = (plan_body->>'price')::NUMERIC, status = coalesce(plan_body->>'status','active')
    WHERE id = target_plan_id RETURNING * INTO saved;
    IF NOT FOUND THEN RAISE EXCEPTION 'Plan not found'; END IF;
    DELETE FROM sales_plan_items WHERE plan_id = saved.id;
  END IF;
  INSERT INTO sales_plan_items(plan_id, item_type, item_id)
    SELECT DISTINCT saved.id, value->>'item_type', (value->>'item_id')::BIGINT
    FROM jsonb_array_elements(plan_body->'items');
  RETURN to_jsonb(saved);
END; $$;
REVOKE ALL ON FUNCTION public.save_sales_plan(BIGINT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_sales_plan(BIGINT, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.create_purchase_cart(cashfree_order_id TEXT, buyer_id UUID, selected_plan_ids BIGINT[])
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total NUMERIC; plan_count INTEGER; names TEXT; snapshot JSONB; items_snapshot JSONB; saved purchase_orders%ROWTYPE;
BEGIN
  IF cardinality(selected_plan_ids) IS NULL OR cardinality(selected_plan_ids) NOT BETWEEN 1 AND 50
    OR cardinality(selected_plan_ids) <> (SELECT count(DISTINCT id) FROM unnest(selected_plan_ids) id)
  THEN RAISE EXCEPTION 'Select unique plans for checkout'; END IF;
  IF NOT EXISTS(SELECT 1 FROM profiles WHERE id = buyer_id AND role = 'student'
    AND lower(coalesce(status,'')) <> 'suspended') THEN RAISE EXCEPTION 'Student not authorized'; END IF;
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
  INSERT INTO purchase_orders(order_id, plan_id, student_id, amount, status, cart_plans, access_items)
    VALUES(cashfree_order_id, CASE WHEN plan_count = 1 THEN selected_plan_ids[1] ELSE NULL END,
      buyer_id, total, 'PENDING', snapshot, items_snapshot) RETURNING * INTO saved;
  RETURN jsonb_build_object('id',saved.id,'amount',total,'plan_name',names,'plans',snapshot);
END; $$;
REVOKE ALL ON FUNCTION public.create_purchase_cart(TEXT, UUID, BIGINT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_purchase_cart(TEXT, UUID, BIGINT[]) TO service_role;

CREATE OR REPLACE FUNCTION public.fulfill_paid_order(cashfree_order_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.purchase_orders%ROWTYPE; p public.profiles%ROWTYPE; items_snapshot JSONB;
BEGIN
  SELECT * INTO o FROM purchase_orders WHERE order_id = cashfree_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF o.status = 'PAID' THEN RETURN; END IF;
  SELECT * INTO p FROM profiles WHERE id = o.student_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Student not found'; END IF;
  items_snapshot := o.access_items;
  IF items_snapshot IS NULL THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('item_type',item_type,'item_id',item_id)), '[]'::JSONB)
    INTO items_snapshot FROM sales_plan_items WHERE plan_id = o.plan_id;
  END IF;
  UPDATE profiles SET
    course = (SELECT string_agg(DISTINCT name, ', ' ORDER BY name) FROM (
      SELECT trim(unnest(string_to_array(coalesce(p.course, ''), ','))) AS name
      UNION SELECT c.title FROM courses c JOIN jsonb_to_recordset(items_snapshot) AS i(item_type TEXT, item_id BIGINT) ON i.item_id = c.id
        WHERE i.item_type = 'course'
    ) names WHERE name <> ''),
    test_series_access = (SELECT string_agg(DISTINCT name, ', ' ORDER BY name) FROM (
      SELECT trim(unnest(string_to_array(coalesce(p.test_series_access, ''), ','))) AS name
      UNION SELECT t.name FROM test_series t JOIN jsonb_to_recordset(items_snapshot) AS i(item_type TEXT, item_id BIGINT) ON i.item_id = t.id
        WHERE i.item_type = 'test_series'
    ) names WHERE name <> '')
  WHERE id = o.student_id;
  INSERT INTO purchases(order_id, plan_id, student_id, amount, granted)
    VALUES(o.order_id, o.plan_id, o.student_id, o.amount, TRUE)
    ON CONFLICT(order_id) DO NOTHING;
  UPDATE purchase_orders SET status = 'PAID' WHERE id = o.id;
END; $$;
REVOKE ALL ON FUNCTION public.fulfill_paid_order(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_paid_order(TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
