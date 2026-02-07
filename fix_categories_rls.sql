-- Create 'categories' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('categories', 'categories', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
CREATE POLICY "Public can view active categories"
ON categories
FOR SELECT
USING (true);

-- Allow admins to manage categories (Insert, Update, Delete)
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories"
ON categories
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Storage Policies for 'categories' bucket

-- Allow public to view images in 'categories' bucket
DROP POLICY IF EXISTS "Public can view category images" ON storage.objects;
CREATE POLICY "Public can view category images"
ON storage.objects
FOR SELECT
USING ( bucket_id = 'categories' );

-- Allow admins to upload/update/delete images in 'categories' bucket
DROP POLICY IF EXISTS "Admins can manage category images" ON storage.objects;
CREATE POLICY "Admins can manage category images"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'categories' AND
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
