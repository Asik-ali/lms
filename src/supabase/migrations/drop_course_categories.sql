-- Migration: Remove course categories
-- Run this in the Supabase SQL Editor to drop the course categories feature from the live database.

-- Drop the category column from courses (it was NOT NULL, so it must be dropped for course creation to work).
ALTER TABLE courses DROP COLUMN IF EXISTS category;

-- Drop the standalone course categories table (and its RLS policies).
DROP TABLE IF EXISTS categories;
