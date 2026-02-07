-- Enable RLS on products table if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Merchants can insert their own products" ON products;
DROP POLICY IF EXISTS "Merchants can update their own products" ON products;
DROP POLICY IF EXISTS "Merchants can delete their own products" ON products;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Merchants can view all their products" ON products;

-- 1. View Policy: Anyone can view active products
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
USING (is_active = true OR auth.uid() IN (
    SELECT merchant_id FROM stores WHERE id = products.store_id
));

-- 2. Insert Policy: Merchants can insert products for their own store
CREATE POLICY "Merchants can insert their own products"
ON products FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT merchant_id FROM stores WHERE id = products.store_id
    )
);

-- 3. Update Policy: Merchants can update their own products
CREATE POLICY "Merchants can update their own products"
ON products FOR UPDATE
USING (
    auth.uid() IN (
        SELECT merchant_id FROM stores WHERE id = products.store_id
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT merchant_id FROM stores WHERE id = products.store_id
    )
);

-- 4. Delete Policy: Merchants can delete their own products
CREATE POLICY "Merchants can delete their own products"
ON products FOR DELETE
USING (
    auth.uid() IN (
        SELECT merchant_id FROM stores WHERE id = products.store_id
    )
);
