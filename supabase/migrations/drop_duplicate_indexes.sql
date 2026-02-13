-- Drop duplicate indexes (Supabase Database Linter warnings)
-- Each dropped index is a duplicate of the kept *_idx index on the same column(s)

-- coupons
DROP INDEX IF EXISTS idx_coupons_code;
DROP INDEX IF EXISTS idx_coupons_store;

-- orders
DROP INDEX IF EXISTS idx_orders_customer;
DROP INDEX IF EXISTS idx_orders_pickup_code;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_store;

-- products
DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_store_id;

-- store_reviews
DROP INDEX IF EXISTS idx_store_reviews_customer;
DROP INDEX IF EXISTS idx_store_reviews_store;
