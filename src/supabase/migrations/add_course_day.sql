-- Add a 'day' column to course_lessons and course_pdfs so admins can group
-- videos and PDFs by day (e.g. a 90-day course with Day 1..Day 90 sections).
-- Existing rows default to 0, which renders under "General".
-- Run in Supabase Dashboard > SQL Editor.

ALTER TABLE course_pdfs ADD COLUMN IF NOT EXISTS day INTEGER DEFAULT 0;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS day INTEGER DEFAULT 0;

NOTIFY pgrst, 'reload schema';
