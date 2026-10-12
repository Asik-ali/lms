-- Apply in Supabase SQL Editor before deploying the updated payment API.
BEGIN;
DROP POLICY IF EXISTS "Students can insert own orders" ON public.purchase_orders;
CREATE OR REPLACE FUNCTION public.fulfill_paid_order(cashfree_order_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.purchase_orders%ROWTYPE; p public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO o FROM purchase_orders WHERE order_id = cashfree_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF o.status = 'PAID' THEN RETURN; END IF;
  SELECT * INTO p FROM profiles WHERE id = o.student_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Student not found'; END IF;
  UPDATE profiles SET
    course = (SELECT string_agg(DISTINCT name, ', ' ORDER BY name) FROM (
      SELECT trim(unnest(string_to_array(coalesce(p.course, ''), ','))) AS name
      UNION SELECT c.title FROM courses c JOIN sales_plan_items i ON i.item_id = c.id
        WHERE i.plan_id = o.plan_id AND i.item_type = 'course'
    ) names WHERE name <> ''),
    test_series_access = (SELECT string_agg(DISTINCT name, ', ' ORDER BY name) FROM (
      SELECT trim(unnest(string_to_array(coalesce(p.test_series_access, ''), ','))) AS name
      UNION SELECT t.name FROM test_series t JOIN sales_plan_items i ON i.item_id = t.id
        WHERE i.plan_id = o.plan_id AND i.item_type = 'test_series'
    ) names WHERE name <> '')
  WHERE id = o.student_id;
  INSERT INTO purchases(order_id, plan_id, student_id, amount, granted)
    VALUES(o.order_id, o.plan_id, o.student_id, o.amount, TRUE)
    ON CONFLICT(order_id) DO NOTHING;
  UPDATE purchase_orders SET status = 'PAID' WHERE id = o.id;
END; $$;
REVOKE ALL ON FUNCTION public.fulfill_paid_order(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_paid_order(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.can_access_test(target_test_id BIGINT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM tests t JOIN test_categories c ON c.id = t.category_id
    JOIN test_series s ON s.id = c.series_id
    JOIN profiles p ON p.id = auth.uid()
    WHERE t.id = target_test_id AND t.status = 'Published'
      AND lower(coalesce(p.status, '')) <> 'suspended'
      AND (s.is_free OR EXISTS (
        SELECT 1 FROM unnest(string_to_array(coalesce(p.test_series_access, ''), ',')) AS entry
        WHERE lower(trim(entry)) = lower(trim(s.name))
      ))
  );
$$;
REVOKE ALL ON FUNCTION public.can_access_test(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_test(BIGINT) TO authenticated;
DROP POLICY IF EXISTS "Everyone can read questions" ON public.questions;
DROP POLICY IF EXISTS "Authorized students can read questions" ON public.questions;
CREATE POLICY "Authorized students can read questions" ON public.questions FOR SELECT TO authenticated
  USING (public.can_access_test(test_id));
DROP POLICY IF EXISTS "Students can insert own attempts" ON public.test_attempts;
CREATE POLICY "Students can insert own attempts" ON public.test_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id AND public.can_access_test(test_id));

-- Signup metadata is user-controlled: it must never assign admin or paid access.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles(id, username, name, email, role, course, enrolled)
  VALUES(NEW.id,
    coalesce(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    coalesce(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email, 'student', NULL, NULL)
  ON CONFLICT(id) DO NOTHING;
  RETURN NEW;
END; $$;
NOTIFY pgrst, 'reload schema';
COMMIT;
