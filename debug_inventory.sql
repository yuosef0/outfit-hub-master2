-- Debug script to verify inventory trigger setup
-- Run this to check if triggers are installed correctly

-- 1. Check if the trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders'
  AND trigger_name = 'manage_inventory_trigger';

-- 2. Check if the function exists
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_name = 'manage_inventory_on_order';

-- 3. Sample: Check product_variants structure
SELECT 
    pv.id,
    pv.product_id,
    p.name as product_name,
    pv.size,
    pv.color,
    pv.stock_quantity
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
LIMIT 5;

-- 4. Check a recent order to see if it has size/color
SELECT 
    id,
    created_at,
    items::text
FROM orders
ORDER BY created_at DESC
LIMIT 1;
