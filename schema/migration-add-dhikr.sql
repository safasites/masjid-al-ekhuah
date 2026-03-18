-- ============================================================
-- Migration: Add Dhikr feature
-- Run this in Supabase SQL Editor if you already have the
-- base schema applied (supabase-schema.sql already run).
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT).
-- ============================================================

-- 1. Create dhikr_items table
CREATE TABLE IF NOT EXISTS dhikr_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arabic_text     TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  meaning_en      TEXT NOT NULL,
  meaning_ar      TEXT,
  meaning_ku      TEXT,
  target_count    INT DEFAULT 33,
  sort_order      INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE dhikr_items ENABLE ROW LEVEL SECURITY;

-- 3. Public read policy
DROP POLICY IF EXISTS "Public read dhikr_items" ON dhikr_items;
CREATE POLICY "Public read dhikr_items" ON dhikr_items FOR SELECT USING (true);

-- 4. Seed default dhikr phrases
INSERT INTO dhikr_items (arabic_text, transliteration, meaning_en, target_count, sort_order) VALUES
  ('سُبْحَانَ اللَّه',              'SubhanAllah',       'Glory be to God',          33,  1),
  ('الْحَمْدُ لِلَّه',             'Alhamdulillah',     'All praise is due to God', 33,  2),
  ('اللَّهُ أَكْبَرُ',             'Allahu Akbar',      'God is the Greatest',      34,  3),
  ('لَا إِلَٰهَ إِلَّا اللَّه', 'La ilaha illallah', 'There is no god but God',  100, 4)
ON CONFLICT DO NOTHING;

-- 5. Add feature toggle and section title to content
INSERT INTO content (key, value) VALUES
  ('feature_dhikr', 'true'),
  ('dhikr_title',   'Remembrance of God')
ON CONFLICT (key) DO NOTHING;
