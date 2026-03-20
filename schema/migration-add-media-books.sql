-- ─── Migration: Add media columns + books module ──────────────────────────────
-- Run this in the Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT DO NOTHING).

-- 1. Add image_url and details columns to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS details   TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS details_ar TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS details_ku TEXT;

-- 2. Add image_url and details columns to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS image_url    TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS details      TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS details_ar   TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS details_ku   TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description_ku TEXT;

-- 3. Create book_categories table
CREATE TABLE IF NOT EXISTS book_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  name_ar    TEXT,
  name_ku    TEXT,
  sort_order INT  DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create books table
CREATE TABLE IF NOT EXISTS books (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  author         TEXT,
  description    TEXT,
  title_ar       TEXT,
  title_ku       TEXT,
  description_ar TEXT,
  description_ku TEXT,
  category_id    UUID REFERENCES book_categories(id) ON DELETE SET NULL,
  image_url      TEXT,
  external_link  TEXT,
  sort_order     INT  DEFAULT 0,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE book_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE books           ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies — public read
DROP POLICY IF EXISTS "Public read book_categories" ON book_categories;
CREATE POLICY "Public read book_categories" ON book_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read books" ON books;
CREATE POLICY "Public read books" ON books FOR SELECT USING (is_active = true);

-- 7. Seed default categories
INSERT INTO book_categories (name, sort_order)
VALUES ('Kids', 1), ('Non-Muslims', 2), ('Muslims', 3)
ON CONFLICT DO NOTHING;

-- 8. Seed feature flags in content table
INSERT INTO content (key, value) VALUES ('feature_books',   'true') ON CONFLICT (key) DO NOTHING;
INSERT INTO content (key, value) VALUES ('animation_mode',  'full') ON CONFLICT (key) DO NOTHING;

-- ─── MANUAL STEP ─────────────────────────────────────────────────────────────
-- Create a PUBLIC storage bucket named "mosque-media" in the Supabase dashboard:
-- Storage → New bucket → Name: mosque-media → Public: ON → Create bucket
-- This enables image uploads for events, courses, and books.
