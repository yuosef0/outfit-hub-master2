-- Migration: Drop old orders table if exists
-- Description: Drops the old orders table to recreate it with the correct schema

-- Drop old orders table and related objects
DROP TABLE IF EXISTS orders CASCADE;
DROP FUNCTION IF EXISTS update_orders_updated_at() CASCADE;
DROP FUNCTION IF EXISTS generate_pickup_code() CASCADE;
