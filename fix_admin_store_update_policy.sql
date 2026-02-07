-- Enable RLS on stores table if not already enabled
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can update stores" ON stores;
DROP POLICY IF EXISTS "Admins can delete stores" ON stores;
DROP POLICY IF EXISTS "Admins can view all stores" ON stores;
DROP POLICY IF EXISTS "Merchants can update own store" ON stores;

-- Policy to allow admins to update any store
CREATE POLICY "Admins can update stores"
ON stores
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Policy to allow admins to delete stores
CREATE POLICY "Admins can delete stores"
ON stores
FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Policy to allow admins to view all stores
CREATE POLICY "Admins can view all stores"
ON stores
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Policy for merchants to update their own store
CREATE POLICY "Merchants can update own store"
ON stores
FOR UPDATE
USING (
  merchant_id = auth.uid()
);
