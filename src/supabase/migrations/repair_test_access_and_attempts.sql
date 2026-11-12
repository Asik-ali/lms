-- Run once on an existing project if students see an RLS error when starting
-- an owned test. Aligns the database policy with paid plan entitlements and
-- accepts published status values regardless of letter case or whitespace.
BEGIN;

ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS available_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.can_access_test(target_test_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1
    FROM public.tests t
    JOIN public.test_categories c ON c.id = t.category_id
    JOIN public.test_series s ON s.id = c.series_id
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE t.id = target_test_id
      AND lower(trim(coalesce(t.status, ''))) = 'published'
      AND (t.available_at IS NULL OR t.available_at <= now())
      AND lower(coalesce(p.status, '')) <> 'suspended'
      AND (
        s.is_free IS TRUE
        OR EXISTS (
          SELECT 1
          FROM unnest(string_to_array(coalesce(p.test_series_access, ''), ',')) AS entry
          WHERE lower(trim(entry)) = lower(trim(s.name))
        )
        OR EXISTS (
          SELECT 1
          FROM public.purchases purchase
          JOIN public.sales_plan_items item ON item.plan_id = purchase.plan_id
          WHERE purchase.student_id = p.id
            AND purchase.granted IS TRUE
            AND item.item_type = 'test_series'
            AND item.item_id = s.id
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_test(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_test(BIGINT) TO authenticated;

DROP POLICY IF EXISTS "Students can insert own attempts" ON public.test_attempts;
CREATE POLICY "Students can insert own attempts" ON public.test_attempts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id AND public.can_access_test(test_id));

NOTIFY pgrst, 'reload schema';
COMMIT;
