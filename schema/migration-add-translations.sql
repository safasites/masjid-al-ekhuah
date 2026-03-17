-- ============================================================
-- Migration: Add translation columns for Arabic & Kurdish
-- ============================================================
-- Run ONLY this file if your database already exists.
-- Go to: Supabase → SQL Editor → New query → paste → Run
-- ============================================================

-- Events table: add Arabic and Kurdish translation columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS title_ar       TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS title_ku       TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS description_ku TEXT;

-- Courses table: add Arabic and Kurdish translation columns
ALTER TABLE courses ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS title_ku TEXT;

-- Content table: add translated about description keys
-- (These are added as new rows, not columns — no ALTER needed)
INSERT INTO content (key, value) VALUES
  ('about_desc_ar', ''),
  ('about_desc_ku', '')
ON CONFLICT (key) DO NOTHING;
