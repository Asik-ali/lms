-- Migration: Remove the instructors table
-- Run this in the Supabase SQL Editor to drop the orphan instructors table from the live database.

DROP TABLE IF EXISTS instructors;

-- Optional: also drop the instructors RLS policies if they ever get re-created by re-running schema.sql
-- (DROP TABLE already removes its policies).
