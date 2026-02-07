-- FIX Foreign Key Constraint for products.category_id
-- The error shows that category_id is currently linked to 'store_categories'.
-- But we want it to link to the global 'categories' (System Categories).

-- 1. Drop the incorrect foreign key constraint
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- 2. Add the correct foreign key constraint pointing to 'categories'
ALTER TABLE products 
ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES categories(id);

-- 3. (Optional) Rename the constraint if it had a different name, 
-- but usually Supabase/Postgres names it {table}_{column}_fkey.
