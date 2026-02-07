-- Enable RLS on slider_images table
ALTER TABLE slider_images ENABLE ROW LEVEL SECURITY;

-- 1. Table Policies for slider_images

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active slider images" ON slider_images;
DROP POLICY IF EXISTS "Admins can manage slider images" ON slider_images;

-- Policy: Anyone can view active slider images
CREATE POLICY "Anyone can view active slider images"
ON slider_images
FOR SELECT
USING (is_active = true OR (auth.role() = 'authenticated' AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin')));

-- Policy: Admins can do everything (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage slider images"
ON slider_images
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- 2. Storage Policies for 'slider_images' bucket

-- Ensure the bucket exists (this part usually needs to be done in UI, but policies can be set)
-- We assume the bucket 'slider_images' exists as per previous instructions.

-- Drop existing storage policies for this bucket to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view slider images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload slider images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update slider images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete slider images" ON storage.objects;

-- Policy: Anyone can view images
CREATE POLICY "Anyone can view slider images"
ON storage.objects
FOR SELECT
USING ( bucket_id = 'slider_images' );

-- Policy: Admins can upload images
CREATE POLICY "Admins can upload slider images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'slider_images' AND
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Policy: Admins can update images
CREATE POLICY "Admins can update slider images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'slider_images' AND
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Policy: Admins can delete images
CREATE POLICY "Admins can delete slider images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'slider_images' AND
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
