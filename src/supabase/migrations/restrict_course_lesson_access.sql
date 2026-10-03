-- Prevent anonymous users and students outside the course from reading lesson links.
-- Run this entire file in the SQL Editor for the Supabase project used by the app.
BEGIN;

-- Older databases may not have the video lesson table yet.
-- The base schema (courses, profiles, and is_admin) must already be installed.
DO $$
DECLARE
  course_id_type TEXT;
BEGIN
  IF to_regclass('public.course_lessons') IS NULL THEN
    SELECT format_type(a.atttypid, a.atttypmod)
    INTO course_id_type
    FROM pg_attribute a
    WHERE a.attrelid = to_regclass('public.courses')
      AND a.attname = 'id' AND NOT a.attisdropped;

    IF course_id_type IS NULL THEN
      RAISE EXCEPTION 'public.courses.id is missing. Run this migration in the app database after installing the base schema.';
    END IF;

    EXECUTE format($table$
      CREATE TABLE public.course_lessons (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        course_id %s NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        video_url TEXT NOT NULL,
        provider TEXT NOT NULL,
        day INTEGER DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    $table$, course_id_type);
  END IF;
END;
$$;

ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS day INTEGER DEFAULT 0;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_lessons TO authenticated;
GRANT ALL ON public.course_lessons TO service_role;

DROP POLICY IF EXISTS "Everyone can read course lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Enrolled students can read course lessons" ON public.course_lessons;
CREATE POLICY "Enrolled students can read course lessons"
ON public.course_lessons FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.profiles p ON p.id = auth.uid()
    CROSS JOIN LATERAL unnest(string_to_array(coalesce(p.course, ''), ',')) AS access_entry(access_name)
    WHERE c.id = course_lessons.course_id
      AND lower(trim(access_name)) = lower(trim(c.title))
      AND lower(coalesce(p.status, '')) <> 'suspended'
  )
);

DROP POLICY IF EXISTS "Admins can manage course lessons" ON public.course_lessons;
CREATE POLICY "Admins can manage course lessons"
ON public.course_lessons FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

NOTIFY pgrst, 'reload schema';
COMMIT;
