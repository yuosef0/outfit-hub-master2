-- ================================================================
-- WIPE DATA SCRIPT
-- ================================================================
-- This script will delete ALL data from the following tables:
-- 1. products
-- 2. store_categories (internal sections)
-- 3. store_subcategories (links)
-- 4. store_reviews
-- 5. store_follows
-- 6. stores
-- 7. users (Only merchants created by the seed script, keeping admins/customers)
-- 8. subcategories
-- 9. categories

-- Use with caution! This cannot be undone.

-- 1. Truncate dependent tables first (Products, Reviews, Follows, Link Tables)
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE store_categories CASCADE;
TRUNCATE TABLE store_subcategories CASCADE;
TRUNCATE TABLE store_reviews CASCADE;
TRUNCATE TABLE store_follows CASCADE;

-- 2. Truncate Stores
TRUNCATE TABLE stores CASCADE;

-- 3. Delete Merchants (Optional: Delete only seed merchants)
-- If you want to delete ALL users who are merchants, uncomment the next line:
-- DELETE FROM users WHERE role = 'merchant';

-- If you want to delete specifically the seed merchants (by email pattern or ID if known):
DELETE FROM users WHERE email LIKE '%@store.com';
DELETE FROM auth.users WHERE email LIKE '%@store.com';

-- 4. Truncate Categories & Subcategories (If you want to re-seed them)
TRUNCATE TABLE subcategories CASCADE;
TRUNCATE TABLE categories CASCADE;

-- ALTERNATIVE: wipe everything (Except users/auth)
-- TRUNCATE TABLE products, store_categories, store_subcategories, store_reviews, store_follows, stores, subcategories, categories CASCADE;
