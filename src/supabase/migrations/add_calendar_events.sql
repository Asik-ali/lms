-- Create the missing calendar_events table (added after the main schema was applied).
-- Run in Supabase Dashboard > SQL Editor.

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

NOTIFY pgrst, 'reload schema';