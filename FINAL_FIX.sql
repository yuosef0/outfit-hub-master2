-- FINAL FIX SCRIPT
-- This script does 3 things:
-- 1. Cleans up "Bad Data" (products with invalid category IDs).
-- 2. Fixes the database link (Foreign Key) to the correct table.
-- 3. Sets up the correct Permissions (RLS) so you can edit products.

-- 1. Clean invalid category_id values
-- If a product has a category_id that doesn't exist in the system categories, set it to NULL.
UPDATE products 
SET category_id = NULL 
WHERE category_id IS NOT NULL 
AND category_id NOT IN (SELECT id FROM categories);

-- 2. Fix the Foreign Key to point to 'categories' table
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE products ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES categories(id);

-- 3. Re-enable Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. Re-create Permissions
DROP POLICY IF EXISTS "Merchants can insert their own products" ON products;
DROP POLICY IF EXISTS "Merchants can update their own products" ON products;
DROP POLICY IF EXISTS "Merchants can delete their own products" ON products;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Merchants can view all their products" ON products;

-- View Policy
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
USING (is_active = true OR auth.uid() IN (SELECT merchant_id FROM stores WHERE id = products.store_id));

-- Insert Policy
CREATE POLICY "Merchants can insert their own products"
ON products FOR INSERT
WITH CHECK (auth.uid() IN (SELECT merchant_id FROM stores WHERE id = products.store_id));

-- Update Policy
CREATE POLICY "Merchants can update their own products"
ON products FOR UPDATE
USING (auth.uid() IN (SELECT merchant_id FROM stores WHERE id = products.store_id))
WITH CHECK (auth.uid() IN (SELECT merchant_id FROM stores WHERE id = products.store_id));

-- Delete Policy
CREATE POLICY "Merchants can delete their own products"
ON products FOR DELETE
USING (auth.uid() IN (SELECT merchant_id FROM stores WHERE id = products.store_id));
