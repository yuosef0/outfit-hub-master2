-- Migration: Add Multi-Variant Cart Support
-- Description: Adds sizes/colors to products and cart_items, and updates cart uniqueness constraint.

-- 1. Update Products Table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT NULL;

COMMENT ON COLUMN products.sizes IS 'Array of available sizes for the product (e.g., ["S", "M", "L"])';
COMMENT ON COLUMN products.colors IS 'Array of available colors for the product (e.g., ["Red", "Blue"])';

-- 2. Update Cart Items Table
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS size TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT NULL;

-- 3. Update Cart Items Constraints
-- First, drop the old unique constraint (user_id, product_id)
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

-- Add new unique index that includes size and color
-- We use a unique index with COALESCE to handle NULLs effectively if needed, 
-- but for simplicity in Supabase/Postgres, standard unique index treats NULLs as distinct.
-- However, we want (user, product, null, null) to be unique vs (user, product, 'M', null).
-- Postgres UNIQUE constraint treats NULLs as distinct values (i.e., NULL != NULL).
-- So (user, product, null, null) and (user, product, null, null) are allowed as duplicates by default in standard SQL unique constraints.
-- BUT, we want to prevent duplicate cart rows for the exact same variant.
-- Solution: Use a unique index where we treat NULL as a specific value or just use standard UNIQUE if we ensure we don't insert duplicates via app logic.
-- Better approach for cart: A user should not have two rows for "Product A, Size M, Color Red".
-- A unique index on (user_id, product_id, size, color) works in Postgres 15+ to prevent duplicates if we consider NULLs distinct? No, standard behavior allows duplicates.
-- We will use `NULLS NOT DISTINCT` if available (Postgres 15+), or just application logic + a unique index that allows multiple nulls if we can't easily enforce it on old Postgres.
-- Check Postgres version? Assuming Postgres 15+ on Supabase.
-- Let's try creating a unique index with COALESCE to be safe and compatible.

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique_variant 
ON cart_items (user_id, product_id, COALESCE(size, ''), COALESCE(color, ''));

-- 4. Notify completion
DO $$
BEGIN
    RAISE NOTICE 'Multi-variant cart support migration completed.';
END $$;
