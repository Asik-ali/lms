-- Add is_free flag to test_series to support a "Free Test Series" section
-- visible to all signed-in users. Run in Supabase Dashboard > SQL Editor.

ALTER TABLE test_series ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;

NOTIFY pgrst, 'reload schema';
