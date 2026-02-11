-- Check cart_items table structure and sample data
SELECT 
    ci.id,
    ci.product_id,
    ci.quantity,
    ci.size,
    ci.color,
    p.name as product_name
FROM cart_items ci
JOIN products p ON p.id = ci.product_id
LIMIT 5;

-- Check if size and color columns exist in cart_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cart_items'
  AND column_name IN ('size', 'color');
