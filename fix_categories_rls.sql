-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories
CREATE POLICY "Public can view active categories"
ON categories
FOR SELECT
USING (true);

-- Allow admins to manage categories (Insert, Update, Delete)
CREATE POLICY "Admins can manage categories"
ON categories
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Storage Policies for 'categories' bucket
-- Make sure the bucket exists first (User needs to create it manually in dashboard if not exists, but policies can be created)

-- Allow public to view images in 'categories' bucket
CREATE POLICY "Public can view category images"
ON storage.objects
FOR SELECT
USING ( bucket_id = 'categories' );

-- Allow admins to upload/update/delete images in 'categories' bucket
CREATE POLICY "Admins can manage category images"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'categories' AND
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
