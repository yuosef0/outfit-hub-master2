-- Add category_id column to products table
-- This is needed to link products to the global system categories (for search/filtering)
-- while keeping the 'category' column for the store-specific section name.

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Optional: Create an index for better performance when filtering by category_id
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'category_id';
