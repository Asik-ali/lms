-- Migration: Make instructor optional on courses (and live_classes for consistency)
-- Run this in the Supabase SQL Editor.
-- Fixes "null value in column \"instructor\" of relation \"courses\" violates not-null constraint"

ALTER TABLE courses ALTER COLUMN instructor DROP NOT NULL;
ALTER TABLE courses ALTER COLUMN instructor SET DEFAULT '';

ALTER TABLE live_classes ALTER COLUMN instructor DROP NOT NULL;
ALTER TABLE live_classes ALTER COLUMN instructor SET DEFAULT '';
