-- Apply in the LMS project's SQL Editor after existing schema/migrations.
-- Does not create permissive policies or alter unrelated/extension tables.
BEGIN;
DO $$
DECLARE t text; seq text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles', 'courses', 'course_pdfs', 'course_lessons', 'assignments', 'assignment_submissions', 'quizzes', 'questions', 'attendance', 'announcements', 'enrollments', 'notifications', 'audit_logs', 'live_classes', 'smtp_settings', 'push_subscriptions', 'pending_signups', 'tickets', 'ticket_replies', 'calendar_events', 'test_series', 'test_categories', 'tests', 'test_attempts', 'test_responses', 'question_reports', 'backup_log', 'sales_plans', 'sales_plan_items', 'purchase_orders', 'purchases', 'referral_settings', 'referral_codes', 'referrals'] LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    SELECT pg_get_serial_sequence(format('public.%I', t), 'id') INTO seq
      WHERE EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = t AND column_name = 'id');
    IF seq IS NOT NULL THEN
      EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated, service_role', seq);
    END IF;
  END LOOP;
END $$;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
-- Only catalog/event data intentionally available before login.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['courses', 'announcements', 'calendar_events', 'test_series', 'test_categories', 'tests', 'sales_plans', 'sales_plan_items'] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    END IF;
  END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, email, role, course, enrolled)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'profile_email', NEW.email),
    'student',
    NEW.raw_user_meta_data ->> 'course',
    NEW.raw_user_meta_data ->> 'enrolled'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
COMMIT;
