-- Run on the existing LMS database to let admins schedule each test.
BEGIN;

ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS available_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.can_access_test(target_test_id BIGINT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM tests t JOIN test_categories c ON c.id = t.category_id
    JOIN test_series s ON s.id = c.series_id
    JOIN profiles p ON p.id = auth.uid()
    WHERE t.id = target_test_id AND t.status = 'Published'
      AND (t.available_at IS NULL OR t.available_at <= now())
      AND lower(coalesce(p.status, '')) <> 'suspended'
      AND (s.is_free OR EXISTS (
        SELECT 1 FROM unnest(string_to_array(coalesce(p.test_series_access, ''), ',')) AS entry
        WHERE lower(trim(entry)) = lower(trim(s.name))
      ))
  );
$$;

DROP POLICY IF EXISTS "Students can insert own attempts" ON public.test_attempts;
CREATE POLICY "Students can insert own attempts" ON public.test_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id AND public.can_access_test(test_id));

NOTIFY pgrst, 'reload schema';
COMMIT;
