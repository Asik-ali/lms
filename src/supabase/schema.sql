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

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON categories FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete categories" ON categories FOR DELETE USING (public.is_admin());

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  instructor TEXT NOT NULL,
  category TEXT NOT NULL,
  students INTEGER DEFAULT 0,
  lessons INTEGER DEFAULT 0,
  duration TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft'
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (public.is_admin());

-- PDF resources for each course
CREATE TABLE IF NOT EXISTS course_pdfs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE course_pdfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read course pdfs" ON course_pdfs FOR SELECT USING (true);
CREATE POLICY "Admins can manage course pdfs" ON course_pdfs FOR ALL USING (public.is_admin());

-- Video lessons for each course. Links may point to YouTube or Google Drive.
CREATE TABLE IF NOT EXISTS course_lessons (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  provider TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read course lessons" ON course_lessons FOR SELECT USING (true);
CREATE POLICY "Admins can manage course lessons" ON course_lessons FOR ALL USING (public.is_admin());

-- Instructors
CREATE TABLE IF NOT EXISTS instructors (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  students INTEGER DEFAULT 0,
  courses INTEGER DEFAULT 0,
  rating REAL DEFAULT 0
);

ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read instructors" ON instructors FOR SELECT USING (true);
CREATE POLICY "Admins can manage instructors" ON instructors FOR ALL USING (public.is_admin());

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
  difficulty TEXT NOT NULL DEFAULT 'Easy'
);

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
  status TEXT NOT NULL DEFAULT 'Upcoming'
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own subscription" ON push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
