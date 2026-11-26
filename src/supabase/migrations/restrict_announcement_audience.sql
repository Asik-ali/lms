-- Apply to the existing Supabase project to enforce announcement audiences.
BEGIN;
DROP POLICY IF EXISTS "Everyone can read announcements" ON public.announcements;
DROP POLICY IF EXISTS "Students can read published announcements" ON public.announcements;
CREATE POLICY "Students can read published announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (lower(trim(status)) = 'published' AND lower(trim(target)) IN ('all', 'students'));
-- The existing admin management policy retains access to all drafts/audiences.
COMMIT;
NOTIFY pgrst, 'reload schema';
