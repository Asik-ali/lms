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
RETURNS TABLE (id BIGINT, course_id BIGINT, title TEXT, day INTEGER, position INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pdf.id, pdf.course_id, pdf.title, pdf.day, pdf.position
  FROM public.course_pdfs pdf JOIN public.courses c ON c.id = pdf.course_id
  WHERE pdf.course_id = p_course_id AND auth.uid() IS NOT NULL
    AND (public.is_admin() OR EXISTS (
      SELECT 1 FROM public.profiles p,
        LATERAL unnest(string_to_array(coalesce(p.course, ''), ',')) access_name
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
CREATE POLICY "Everyone can read course lessons" ON course_lessons FOR SELECT USING (true);
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
