-- Run after add_cart_checkout.sql. Lets admins add a public schedule PDF preview to a plan.
BEGIN;

ALTER TABLE public.sales_plans ADD COLUMN IF NOT EXISTS preview_pdf_url TEXT NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.save_sales_plan(target_plan_id BIGINT, plan_body JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE saved sales_plans%ROWTYPE; item JSONB; item_id_value BIGINT; item_type_value TEXT; preview_url TEXT;
BEGIN
  IF coalesce(trim(plan_body->>'name'), '') = '' THEN RAISE EXCEPTION 'Plan name is required'; END IF;
  IF coalesce(plan_body->>'price', '') = '' OR (plan_body->>'price')::NUMERIC <= 0
     OR (plan_body->>'price')::NUMERIC > 99999999.99
     OR (plan_body->>'price')::NUMERIC <> round((plan_body->>'price')::NUMERIC, 2)
  THEN RAISE EXCEPTION 'Enter a positive price with at most two decimal places'; END IF;
  IF coalesce(plan_body->>'status', 'active') NOT IN ('active', 'inactive') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  preview_url := trim(coalesce(plan_body->>'preview_pdf_url', ''));
  IF preview_url <> '' AND preview_url !~ '^https://' THEN RAISE EXCEPTION 'Schedule preview must use an HTTPS link'; END IF;
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
    INSERT INTO sales_plans(name, description, price, status, preview_pdf_url)
    VALUES(trim(plan_body->>'name'), coalesce(plan_body->>'description',''), (plan_body->>'price')::NUMERIC,
      coalesce(plan_body->>'status','active'), preview_url) RETURNING * INTO saved;
  ELSE
    UPDATE sales_plans SET name = trim(plan_body->>'name'), description = coalesce(plan_body->>'description',''),
      price = (plan_body->>'price')::NUMERIC, status = coalesce(plan_body->>'status','active'), preview_pdf_url = preview_url
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
NOTIFY pgrst, 'reload schema';
COMMIT;
