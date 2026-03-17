-- ============================================================
-- Masjid Al-Ekhuah — Supabase Database Schema
-- Run this entire file in the Supabase SQL Editor:
--   https://supabase.com → your project → SQL Editor → New query
-- ============================================================

-- ─── 1. Content (key-value site settings) ────────────────────
CREATE TABLE IF NOT EXISTS content (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with default values
INSERT INTO content (key, value) VALUES
  ('hero_line1',       'Awaken Your'),
  ('hero_line2',       'Faith'),
  ('about_desc',       'Masjid Al-Ekhuah is a welcoming community in the heart of Birmingham, dedicated to worship, education, and serving the local community.'),
  ('contact_address',  'New Spring St, Birmingham B18 7PW, United Kingdom'),
  ('contact_phone',    '0121 507 0166'),
  ('contact_email',    'info@masjidalekhuah.com'),
  ('prayer_method',    '1'),
  ('prayer_school',    '1')
ON CONFLICT (key) DO NOTHING;

-- ─── 2. Events ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  date_label  TEXT NOT NULL,
  description TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with default events
INSERT INTO events (title, date_label, description, is_featured, sort_order) VALUES
  ('Friday Khutbah',    'Every Friday, 1:00 PM',    'Weekly congregational prayer and sermon.',            true,  1),
  ('Youth Halaqah',     'Saturdays, 5:00 PM',       'Interactive Islamic studies for the youth.',          false, 2),
  ('Community Iftar',   'Ramadan Weekends',          'Break fast together with the community.',             false, 3)
ON CONFLICT DO NOTHING;

-- ─── 3. Courses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  level       TEXT NOT NULL,
  duration    TEXT NOT NULL,
  description TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with default courses
INSERT INTO courses (title, level, duration, sort_order) VALUES
  ('Quranic Arabic',         'Beginner',      '12 Weeks', 1),
  ('Tajweed Rules',          'Intermediate',  '8 Weeks',  2),
  ('Seerah of the Prophet',  'All Levels',    'Ongoing',  3)
ON CONFLICT DO NOTHING;

-- ─── 4. Jamat (congregation) times ───────────────────────────
CREATE TABLE IF NOT EXISTS jamat_times (
  prayer     TEXT PRIMARY KEY,  -- fajr | dhuhr | asr | maghrib | isha | jumuah
  time       TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with placeholder jamat times (admin should update these)
INSERT INTO jamat_times (prayer, time) VALUES
  ('fajr',    '06:00 AM'),
  ('dhuhr',   '01:30 PM'),
  ('asr',     '05:15 PM'),
  ('maghrib', '5 mins after Azan'),
  ('isha',    '09:15 PM'),
  ('jumuah',  '01:15 PM')
ON CONFLICT (prayer) DO NOTHING;

-- ─── 5. Timetable images ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label      TEXT NOT NULL,        -- e.g. "March 2026"
  image_url  TEXT NOT NULL,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. Row Level Security (RLS) ─────────────────────────────
-- All tables are publicly readable (no auth needed for visitors).
-- Write operations are only allowed via the service role key (API routes).

ALTER TABLE content     ENABLE ROW LEVEL SECURITY;
ALTER TABLE events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE jamat_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable   ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read content"      ON content     FOR SELECT USING (true);
CREATE POLICY "Public read events"       ON events      FOR SELECT USING (true);
CREATE POLICY "Public read courses"      ON courses     FOR SELECT USING (true);
CREATE POLICY "Public read jamat_times"  ON jamat_times FOR SELECT USING (true);
CREATE POLICY "Public read timetable"    ON timetable   FOR SELECT USING (true);

-- ─── 7. Supabase Storage bucket ──────────────────────────────
-- After running this SQL, go to Storage in the Supabase dashboard and:
-- 1. Create a new bucket called: timetable-images
-- 2. Set it to PUBLIC
-- The admin upload API will use the service role key to bypass RLS for uploads.
