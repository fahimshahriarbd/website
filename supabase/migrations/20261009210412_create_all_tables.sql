/*
# Create all website content tables

This migration creates the complete database schema for Fahim Shahriar's personal website.
All content previously stored in Google Sheets is migrated to Supabase tables.

## New Tables:
1. blog_posts — blog articles (title, category, image, date, read_time, summary, content, link, published)
2. projects — portfolio projects (icon, title, category, description, details, image, link, published, sort_order)
3. services — service offerings (icon, title, category, price, description, is_active, sort_order)
4. achievements — achievements & recognition (icon, title, description, published, sort_order)
5. testimonials — people's testimonials (name, tag, about, role, feedback, image, link, published, sort_order)
6. gallery_photos — photo gallery (category, image_url, caption, sort_order)
7. cvs — CV documents (title, download_link, password, sort_order)
8. messages — contact form submissions (name, email, subject, message, created_at)
9. bookings — service booking requests (name, mobile, location, service_title, amount, payment_gateway, payment_number, trx_id, notes, status, created_at)
10. dental_tips — dental health tips (icon, title, content, category, published, sort_order)
11. faq — frequently asked questions (question, answer, category, published, sort_order)

## Security:
- RLS enabled on ALL tables
- Public tables (blog, projects, services, achievements, testimonials, gallery, cvs, dental_tips, faq): anon can SELECT published rows only
- messages: anon can INSERT (contact form), only authenticated can SELECT
- bookings: anon can INSERT (booking form), only authenticated can SELECT
- authenticated (admin) can do full CRUD on all tables

## Notes:
1. This is a single-admin website — the owner logs in via Supabase auth to manage content
2. Public visitors can read published content and submit contact messages / bookings
3. Unpublished/draft items are only visible to authenticated admin
*/

-- ============================================================
-- 1. BLOG POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Blog',
  image text DEFAULT '',
  date date DEFAULT CURRENT_DATE,
  read_time text DEFAULT '5',
  summary text DEFAULT '',
  content text DEFAULT '',
  link text DEFAULT '#',
  published boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_blogs" ON blog_posts;
CREATE POLICY "public_read_published_blogs" ON blog_posts FOR SELECT
  TO anon, authenticated USING (published = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_insert_blogs" ON blog_posts;
CREATE POLICY "admin_insert_blogs" ON blog_posts FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_blogs" ON blog_posts;
CREATE POLICY "admin_update_blogs" ON blog_posts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_blogs" ON blog_posts;
CREATE POLICY "admin_delete_blogs" ON blog_posts FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 2. PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text DEFAULT '🚀',
  title text NOT NULL,
  category text DEFAULT 'General',
  description text DEFAULT '',
  details text DEFAULT '',
  image text DEFAULT '',
  link text DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_projects" ON projects;
CREATE POLICY "public_read_published_projects" ON projects FOR SELECT
  TO anon, authenticated USING (published = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_insert_projects" ON projects;
CREATE POLICY "admin_insert_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_projects" ON projects;
CREATE POLICY "admin_update_projects" ON projects FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_projects" ON projects;
CREATE POLICY "admin_delete_projects" ON projects FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 3. SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text DEFAULT '💼',
  title text NOT NULL,
  category text DEFAULT 'General',
  price text DEFAULT '1,000 BDT',
  description text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_services" ON services;
CREATE POLICY "public_read_active_services" ON services FOR SELECT
  TO anon, authenticated USING (is_active = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_insert_services" ON services;
CREATE POLICY "admin_insert_services" ON services FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_services" ON services;
CREATE POLICY "admin_update_services" ON services FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_services" ON services;
CREATE POLICY "admin_delete_services" ON services FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 4. ACHIEVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text DEFAULT '🏆',
  title text NOT NULL,
  description text DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_achievements" ON achievements;
CREATE POLICY "public_read_published_achievements" ON achievements FOR SELECT
  TO anon, authenticated USING (published = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_insert_achievements" ON achievements;
CREATE POLICY "admin_insert_achievements" ON achievements FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_achievements" ON achievements;
CREATE POLICY "admin_update_achievements" ON achievements FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_achievements" ON achievements;
CREATE POLICY "admin_delete_achievements" ON achievements FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 5. TESTIMONIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tag text DEFAULT 'Friend',
  about text DEFAULT 'Website',
  role text DEFAULT '',
  feedback text DEFAULT '',
  image text DEFAULT '',
  link text DEFAULT '#',
  published boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_testimonials" ON testimonials;
CREATE POLICY "public_read_published_testimonials" ON testimonials FOR SELECT
  TO anon, authenticated USING (published = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_insert_testimonials" ON testimonials;
CREATE POLICY "admin_insert_testimonials" ON testimonials FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_testimonials" ON testimonials;
CREATE POLICY "admin_update_testimonials" ON testimonials FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_testimonials" ON testimonials;
CREATE POLICY "admin_delete_testimonials" ON testimonials FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 6. GALLERY PHOTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text DEFAULT 'Moments',
  image_url text NOT NULL,
  caption text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_gallery" ON gallery_photos;
CREATE POLICY "public_read_gallery" ON gallery_photos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_gallery" ON gallery_photos;
CREATE POLICY "admin_insert_gallery" ON gallery_photos FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_gallery" ON gallery_photos;
CREATE POLICY "admin_update_gallery" ON gallery_photos FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_gallery" ON gallery_photos;
CREATE POLICY "admin_delete_gallery" ON gallery_photos FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 7. CVs
-- ============================================================
CREATE TABLE IF NOT EXISTS cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  download_link text NOT NULL,
  password text DEFAULT '0',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_cvs" ON cvs;
CREATE POLICY "public_read_cvs" ON cvs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_cvs" ON cvs;
CREATE POLICY "admin_insert_cvs" ON cvs FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_cvs" ON cvs;
CREATE POLICY "admin_update_cvs" ON cvs FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_cvs" ON cvs;
CREATE POLICY "admin_delete_cvs" ON cvs FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 8. MESSAGES (Contact Form)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text DEFAULT '',
  message text DEFAULT '',
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_messages" ON messages;
CREATE POLICY "public_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_messages" ON messages;
CREATE POLICY "admin_read_messages" ON messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_messages" ON messages;
CREATE POLICY "admin_update_messages" ON messages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_messages" ON messages;
CREATE POLICY "admin_delete_messages" ON messages FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 9. BOOKINGS (Service Requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text NOT NULL,
  location text DEFAULT '',
  service_title text NOT NULL,
  amount text DEFAULT '',
  payment_gateway text DEFAULT 'bKash',
  payment_number text DEFAULT '',
  trx_id text DEFAULT '',
  notes text DEFAULT '',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_bookings" ON bookings;
CREATE POLICY "public_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_bookings" ON bookings;
CREATE POLICY "admin_read_bookings" ON bookings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_bookings" ON bookings;
CREATE POLICY "admin_update_bookings" ON bookings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_bookings" ON bookings;
CREATE POLICY "admin_delete_bookings" ON bookings FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 10. DENTAL TIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS dental_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text DEFAULT '🦷',
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'General',
  published boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dental_tips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_dental_tips" ON dental_tips;
CREATE POLICY "public_read_published_dental_tips" ON dental_tips FOR SELECT
  TO anon, authenticated USING (published = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_insert_dental_tips" ON dental_tips;
CREATE POLICY "admin_insert_dental_tips" ON dental_tips FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_dental_tips" ON dental_tips;
CREATE POLICY "admin_update_dental_tips" ON dental_tips FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_dental_tips" ON dental_tips;
CREATE POLICY "admin_delete_dental_tips" ON dental_tips FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 11. FAQ
-- ============================================================
CREATE TABLE IF NOT EXISTS faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'General',
  published boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_faq" ON faq;
CREATE POLICY "public_read_published_faq" ON faq FOR SELECT
  TO anon, authenticated USING (published = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_insert_faq" ON faq;
CREATE POLICY "admin_insert_faq" ON faq FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_faq" ON faq;
CREATE POLICY "admin_update_faq" ON faq FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_faq" ON faq;
CREATE POLICY "admin_delete_faq" ON faq FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_published ON projects(published, sort_order);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_achievements_published ON achievements(published, sort_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON testimonials(published, sort_order);
CREATE INDEX IF NOT EXISTS idx_gallery_sort ON gallery_photos(sort_order);
CREATE INDEX IF NOT EXISTS idx_dental_tips_published ON dental_tips(published, sort_order);
CREATE INDEX IF NOT EXISTS idx_faq_published ON faq(published, sort_order);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
