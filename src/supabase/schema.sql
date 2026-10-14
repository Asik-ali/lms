-- Run this in Supabase SQL Editor

-- Helper function to check admin role (bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Function for admins to reset a student's password
CREATE OR REPLACE FUNCTION public.admin_reset_student_password(student_id UUID, new_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _role TEXT;
BEGIN
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
  IF _role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can reset passwords';
  END IF;
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
      updated_at = NOW()
  WHERE id = student_id;
  RETURN new_password;
END;
$$;

-- Function for admins to permanently delete a student (removes the auth account, cascading to profiles/data)
CREATE OR REPLACE FUNCTION public.admin_delete_student(student_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _role TEXT;
BEGIN
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
  IF _role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete students';
  END IF;
  DELETE FROM auth.users WHERE id = student_id;
END;
$$;

-- Extended user profiles (links to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  course TEXT,
  enrolled TEXT,
  progress REAL DEFAULT 0,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE USING (public.is_admin());

-- Create the public profile whenever a new auth account is created.
-- This keeps the students table in sync with student sign-ups.
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
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
    NEW.raw_user_meta_data ->> 'course',
    NEW.raw_user_meta_data ->> 'enrolled'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  instructor TEXT NOT NULL DEFAULT '',
  students INTEGER DEFAULT 0,
  lessons INTEGER DEFAULT 0,
  duration TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft'
);

-- Relax the NOT NULL constraint on instructor so courses can be created without one.
ALTER TABLE courses ALTER COLUMN instructor DROP NOT NULL;
ALTER TABLE courses ALTER COLUMN instructor SET DEFAULT '';
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (public.is_admin());

-- PDF resources for each course
CREATE TABLE IF NOT EXISTS course_pdfs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  day INTEGER DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE course_pdfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage course pdfs" ON course_pdfs FOR ALL USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.course_pdf_metadata(p_course_id BIGINT)
RETURNS TABLE (id BIGINT, course_id BIGINT, title TEXT, day INTEGER, "position" INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pdf.id, pdf.course_id, pdf.title, pdf.day, pdf.position
  FROM public.course_pdfs pdf JOIN public.courses c ON c.id = pdf.course_id
  WHERE pdf.course_id = p_course_id AND auth.uid() IS NOT NULL
    AND (public.is_admin() OR EXISTS (
      SELECT 1 FROM public.profiles p,
        LATERAL unnest(string_to_array(coalesce(p.course, ''), ',')) AS access_entry(access_name)
      WHERE p.id = auth.uid() AND lower(trim(access_name)) = lower(trim(c.title))
    ))
  ORDER BY pdf.position, pdf.id;
$$;
REVOKE ALL ON FUNCTION public.course_pdf_metadata(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.course_pdf_metadata(BIGINT) TO authenticated;

-- Video lessons for each course. Links may point to YouTube or Google Drive.
CREATE TABLE IF NOT EXISTS course_lessons (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  provider TEXT NOT NULL,
  day INTEGER DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled students can read course lessons" ON course_lessons FOR SELECT TO authenticated
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
CREATE POLICY "Admins can manage course lessons" ON course_lessons FOR ALL USING (public.is_admin());

-- Instructors
-- NOTE: The instructors table has been removed. Drop it in the live DB with:
--   DROP TABLE IF EXISTS instructors;

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  due_date TEXT NOT NULL,
  submissions INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active'
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read assignments" ON assignments FOR SELECT USING (true);
CREATE POLICY "Admins can manage assignments" ON assignments FOR ALL USING (public.is_admin());

-- Assignment submissions (link only, no file upload)
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  link TEXT NOT NULL,
  grade REAL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can read own submissions" ON assignment_submissions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own submissions" ON assignment_submissions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own submissions" ON assignment_submissions FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Instructors and admins can read all submissions" ON assignment_submissions FOR SELECT USING (public.is_admin() OR EXISTS (SELECT 1 FROM courses WHERE instructor = (SELECT name FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Instructors and admins can grade submissions" ON assignment_submissions FOR UPDATE USING (public.is_admin() OR EXISTS (SELECT 1 FROM courses WHERE instructor = (SELECT name FROM profiles WHERE id = auth.uid())));

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  questions INTEGER DEFAULT 0,
  total_marks INTEGER,
  duration TEXT,
  status TEXT NOT NULL DEFAULT 'Draft'
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read quizzes" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Admins can manage quizzes" ON quizzes FOR ALL USING (public.is_admin());

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Multiple Choice',
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Easy',
  test_name TEXT DEFAULT ''
);

-- Columns used by the exam/test builders (safe to run on existing databases)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_a TEXT DEFAULT '';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_b TEXT DEFAULT '';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_c TEXT DEFAULT '';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_d TEXT DEFAULT '';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_answer TEXT DEFAULT 'A';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT DEFAULT '';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS test_id BIGINT REFERENCES tests(id) ON DELETE SET NULL;

-- For existing databases, run:
-- ALTER TABLE questions ADD COLUMN IF NOT EXISTS test_name TEXT DEFAULT '';

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON questions FOR ALL USING (public.is_admin());

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  course TEXT NOT NULL,
  present INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  percentage REAL DEFAULT 0
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Admins can manage attendance" ON attendance FOR ALL USING (public.is_admin());

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT 'All',
  created TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Published'
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (public.is_admin());

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  course TEXT NOT NULL,
  requested TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending'
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read enrollments" ON enrollments FOR SELECT USING (true);
CREATE POLICY "Admins can manage enrollments" ON enrollments FOR ALL USING (public.is_admin());

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info'
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Admins can manage notifications" ON notifications FOR ALL USING (public.is_admin());

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read audit logs" ON audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (public.is_admin());

-- Live Classes
CREATE TABLE IF NOT EXISTS live_classes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  instructor TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  description TEXT DEFAULT '',
  room_code TEXT NOT NULL,
  students INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Upcoming',
  youtube_url TEXT DEFAULT ''
);

ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read live_classes" ON live_classes FOR SELECT USING (true);
CREATE POLICY "Admins can manage live_classes" ON live_classes FOR ALL USING (public.is_admin());

-- SMTP Settings (single row)
CREATE TABLE IF NOT EXISTS smtp_settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
  port INTEGER NOT NULL DEFAULT 587,
  username TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL DEFAULT '',
  sender_name TEXT NOT NULL DEFAULT 'LMS Platform',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE smtp_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read smtp_settings" ON smtp_settings FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage smtp_settings" ON smtp_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token_type)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own subscription" ON push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Pending Signups (public self-registration with email OTP verification)
CREATE TABLE IF NOT EXISTS pending_signups (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  username TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pending_signups ENABLE ROW LEVEL SECURITY;
-- No anonymous read/write is allowed; signups go through the API using the service role.

-- Support Tickets (student → admin)
CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can read own tickets" ON tickets FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Admins can read all tickets" ON tickets FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update tickets" ON tickets FOR UPDATE USING (public.is_admin());

-- Ticket replies
CREATE TABLE IF NOT EXISTS ticket_replies (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can read own ticket replies" ON ticket_replies FOR SELECT USING (
  EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_replies.ticket_id AND tickets.student_id = auth.uid())
);
CREATE POLICY "Students can insert own ticket replies" ON ticket_replies FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admins can read all ticket replies" ON ticket_replies FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert ticket replies" ON ticket_replies FOR INSERT WITH CHECK (public.is_admin());

-- Calendar Events (admin-created)
CREATE TABLE IF NOT EXISTS calendar_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT DEFAULT '',
  description TEXT DEFAULT '',
  color TEXT DEFAULT 'indigo',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read events" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "Admins can insert events" ON calendar_events FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update events" ON calendar_events FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete events" ON calendar_events FOR DELETE USING (public.is_admin());

-- Test Series (exam categories like SSC CGL, SSC CHSL, etc.)
CREATE TABLE IF NOT EXISTS test_series (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_free BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE test_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read test_series" ON test_series FOR SELECT USING (true);
CREATE POLICY "Admins can manage test_series" ON test_series FOR ALL USING (public.is_admin());

-- Test Categories (sections within a series, supports nesting via parent_id)
CREATE TABLE IF NOT EXISTS test_categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  series_id BIGINT NOT NULL REFERENCES test_series(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id BIGINT REFERENCES test_categories(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE test_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read test_categories" ON test_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage test_categories" ON test_categories FOR ALL USING (public.is_admin());

-- Tests (individual tests with full metadata)
DROP TABLE IF EXISTS tests CASCADE;
CREATE TABLE IF NOT EXISTS tests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES test_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  duration INTEGER DEFAULT 90,
  total_marks INTEGER DEFAULT 270,
  question_count INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'Moderate',
  language TEXT DEFAULT 'English',
  instructions TEXT DEFAULT '',
  syllabus TEXT DEFAULT '',
  status TEXT DEFAULT 'Published',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read tests" ON tests FOR SELECT USING (true);
CREATE POLICY "Admins can manage tests" ON tests FOR ALL USING (public.is_admin());

-- Add test_id FK to questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS test_id BIGINT REFERENCES tests(id) ON DELETE SET NULL;

-- Test series access per student
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS test_series_access TEXT DEFAULT '';

-- Test Attempts (student's test session)
CREATE TABLE IF NOT EXISTS test_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  test_id BIGINT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  total_marks INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  time_taken INTEGER DEFAULT 0,
  rank INTEGER,
  percentile TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress'
);

ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can read own attempts" ON test_attempts FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own attempts" ON test_attempts FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own attempts" ON test_attempts FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Admins can read all attempts" ON test_attempts FOR SELECT USING (public.is_admin());

-- Test Responses (each question answer)
CREATE TABLE IF NOT EXISTS test_responses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attempt_id BIGINT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  student_answer TEXT DEFAULT '',
  is_correct BOOLEAN,
  time_spent INTEGER DEFAULT 0,
  status TEXT DEFAULT 'not_attempted',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

ALTER TABLE test_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can read own responses" ON test_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM test_attempts WHERE test_attempts.id = test_responses.attempt_id AND test_attempts.student_id = auth.uid())
);
CREATE POLICY "Students can insert own responses" ON test_responses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM test_attempts WHERE test_attempts.id = test_responses.attempt_id AND test_attempts.student_id = auth.uid())
);
CREATE POLICY "Students can update own responses" ON test_responses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM test_attempts WHERE test_attempts.id = test_responses.attempt_id AND test_attempts.student_id = auth.uid())
);
CREATE POLICY "Admins can read all responses" ON test_responses FOR SELECT USING (public.is_admin());

-- Question Reports
CREATE TABLE IF NOT EXISTS question_reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can insert reports" ON question_reports FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can read own reports" ON question_reports FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins can read all reports" ON question_reports FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update reports" ON question_reports FOR UPDATE USING (public.is_admin());

-- Backup Log (tracks automatic/manual backups)
CREATE TABLE IF NOT EXISTS backup_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  emailed_to TEXT[] DEFAULT '{}',
  record_counts JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'success',
  error TEXT
);

ALTER TABLE backup_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage backup_log" ON backup_log FOR ALL USING (public.is_admin());

-- ============================================================
-- Sales / Sell Courses (combo or individual) + Cashfree checkout
-- ============================================================

-- A purchasable plan: either a single course/test-series or a combo.
CREATE TABLE IF NOT EXISTS sales_plans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',   -- active | hidden
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active sales plans" ON sales_plans FOR SELECT USING (status = 'active' OR public.is_admin());
CREATE POLICY "Admins can manage sales plans" ON sales_plans FOR ALL USING (public.is_admin());

-- Items included in a plan (item_type: 'course' | 'test_series')
CREATE TABLE IF NOT EXISTS sales_plan_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES sales_plans(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,   -- 'course' | 'test_series'
  item_id BIGINT NOT NULL,
  UNIQUE(plan_id, item_type, item_id)
);

ALTER TABLE sales_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sales plan items" ON sales_plan_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM sales_plans WHERE sales_plans.id = sales_plan_items.plan_id AND (sales_plans.status = 'active' OR public.is_admin()))
);
CREATE POLICY "Admins can manage sales plan items" ON sales_plan_items FOR ALL USING (public.is_admin());

-- Orders created for Cashfree checkout
CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,          -- Cashfree order_id
  payment_session_id TEXT DEFAULT '',
  plan_id BIGINT NOT NULL REFERENCES sales_plans(id),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'PENDING',          -- PENDING | PAID | FAILED | CANCELLED
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can read own orders" ON purchase_orders FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own orders" ON purchase_orders FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Admins can read all orders" ON purchase_orders FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update orders" ON purchase_orders FOR UPDATE USING (public.is_admin());

-- Record of completed, access-granting purchases
CREATE TABLE IF NOT EXISTS purchases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  plan_id BIGINT NOT NULL REFERENCES sales_plans(id),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  granted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can read own purchases" ON purchases FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins can read all purchases" ON purchases FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert purchases" ON purchases FOR INSERT WITH CHECK (public.is_admin());

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
-- Run after add_cart_checkout.sql and allow_permanent_plan_delete.sql.
BEGIN;
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  reward_amount NUMERIC(10,2) NOT NULL CHECK (reward_amount >= 0)
);
INSERT INTO public.referral_settings VALUES (1, 100) ON CONFLICT DO NOTHING;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.referral_codes (
  student_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[A-F0-9]{12}$')
);
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signups ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.referrals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  qualified_at TIMESTAMPTZ,
  qualifying_order_id TEXT UNIQUE,
  reward_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (reward_amount >= 0),
  reward_status TEXT NOT NULL DEFAULT 'pending' CHECK (reward_status IN ('pending', 'credited')),
  CHECK (referrer_id <> referred_id)
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals(referrer_id, created_at DESC);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
-- All referral writes and reads go through authenticated server endpoints.
REVOKE ALL ON public.referral_codes, public.referrals, public.referral_settings FROM anon, authenticated;
GRANT ALL ON public.referral_codes, public.referrals, public.referral_settings TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.referrals_id_seq TO service_role;

ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS credit_applied NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (credit_applied >= 0);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS credit_released BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.referral_credit_balance(buyer_id UUID)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT greatest(0,
    coalesce((SELECT sum(reward_amount) FROM referrals WHERE referrer_id = buyer_id AND reward_status = 'credited'),0)
    - coalesce((SELECT sum(credit_applied) FROM purchase_orders WHERE student_id = buyer_id AND NOT credit_released),0));
$$;
REVOKE ALL ON FUNCTION public.referral_credit_balance(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.referral_credit_balance(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.reward_first_referral_purchase()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.granted IS NOT TRUE OR NEW.amount <= 0 THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM purchases WHERE student_id = NEW.student_id AND granted AND order_id <> NEW.order_id) THEN RETURN NEW; END IF;
  -- The referred_id uniqueness and conditional update serialize retries and concurrent purchases.
  UPDATE referrals SET qualified_at = now(), qualifying_order_id = NEW.order_id,
    reward_amount = (SELECT reward_amount FROM referral_settings WHERE id = 1), reward_status = 'credited'
  WHERE referred_id = NEW.student_id AND qualified_at IS NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = referrals.referrer_id AND role = 'student' AND lower(coalesce(status,'')) <> 'suspended');
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.reward_first_referral_purchase() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS reward_first_referral_purchase ON public.purchases;
CREATE TRIGGER reward_first_referral_purchase AFTER INSERT OR UPDATE OF granted ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.reward_first_referral_purchase();

-- Reuse existing cart validation and snapshot logic. Reserve credit under a per-student lock.
CREATE OR REPLACE FUNCTION public.create_purchase_cart_with_credit(
  cashfree_order_id TEXT, buyer_id UUID, selected_plan_ids BIGINT[], use_credit BOOLEAN
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE saved JSONB; applied NUMERIC := 0; available NUMERIC;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(buyer_id::TEXT, 0));
  saved := public.create_purchase_cart(cashfree_order_id, buyer_id, selected_plan_ids);
  IF use_credit THEN
    available := public.referral_credit_balance(buyer_id);
    -- Keep at least INR 1 payable through Cashfree; excess credit stays available.
    applied := least(available, greatest(0, (saved->>'amount')::NUMERIC - 1));
    UPDATE purchase_orders SET amount = amount - applied, credit_applied = applied
      WHERE id = (saved->>'id')::BIGINT;
  END IF;
  RETURN saved || jsonb_build_object('credit_applied', applied, 'amount', (saved->>'amount')::NUMERIC - applied);
END; $$;
REVOKE ALL ON FUNCTION public.create_purchase_cart_with_credit(TEXT, UUID, BIGINT[], BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_purchase_cart_with_credit(TEXT, UUID, BIGINT[], BOOLEAN) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
-- Run after add_referrals.sql. Safely close failed/cancelled payment orders.
BEGIN;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS close_reason TEXT
  CHECK (close_reason IN ('FAILED', 'CANCELLED'));

-- Called only by the server after checking Cashfree. Both stages lock the same
-- order as fulfillment; a racing successful payment always keeps its credit.
CREATE OR REPLACE FUNCTION public.close_purchase_order(
  cashfree_order_id TEXT, reason TEXT, provider_closed BOOLEAN
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.purchase_orders%ROWTYPE;
BEGIN
  IF reason IS NULL OR reason NOT IN ('FAILED', 'CANCELLED') THEN RAISE EXCEPTION 'Invalid close reason'; END IF;
  SELECT * INTO o FROM purchase_orders WHERE order_id = cashfree_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF o.status = 'PAID' OR o.credit_released THEN RETURN to_jsonb(o); END IF;
  UPDATE purchase_orders SET
    close_reason = coalesce(o.close_reason, reason),
    status = CASE WHEN provider_closed IS TRUE THEN coalesce(o.close_reason, reason) ELSE 'CANCELLING' END,
    credit_released = provider_closed IS TRUE
  WHERE id = o.id RETURNING * INTO o;
  RETURN to_jsonb(o);
END; $$;
REVOKE ALL ON FUNCTION public.close_purchase_order(TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_purchase_order(TEXT, TEXT, BOOLEAN) TO service_role;

-- Never grant access to an order whose credit was already returned, and never
-- return credit from a completed paid purchase via the failed-order pathway.
CREATE OR REPLACE FUNCTION public.guard_paid_order_credit()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'PAID' AND NEW.credit_released THEN
    RAISE EXCEPTION 'Cannot fulfill an order with returned credit';
  END IF;
  IF OLD.status = 'PAID' AND NEW.credit_released THEN
    RAISE EXCEPTION 'Cannot return paid order credit through cancellation';
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_paid_order_credit() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_paid_order_credit ON public.purchase_orders;
CREATE TRIGGER guard_paid_order_credit BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_paid_order_credit();
NOTIFY pgrst, 'reload schema';
COMMIT;
