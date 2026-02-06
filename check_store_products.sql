-- Check store IDs and their products
-- Run this in Supabase SQL Editor to see the actual store IDs

SELECT 
    s.id as store_id,
    s.name as store_name,
    COUNT(p.id) as product_count
FROM stores s
LEFT JOIN products p ON p.store_id = s.id
GROUP BY s.id, s.name
ORDER BY s.name;

-- If you want to see specific store details:
-- Replace 'Bag Boutique' with any store name
SELECT 
    s.id as store_id,
    s.name as store_name,
    p.id as product_id,
    p.name as product_name,
    p.price
FROM stores s
LEFT JOIN products p ON p.store_id = s.id
WHERE s.name = 'Bag Boutique'
ORDER BY p.created_at DESC;
