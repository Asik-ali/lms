-- Add rank/percentile to test_attempts so rank is frozen on a student's
-- first attempt only (later attempts do not update the rank).
-- Run in Supabase Dashboard > SQL Editor.

ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS percentile TEXT;

NOTIFY pgrst, 'reload schema';