-- 1. Check if trigger exists and is enabled
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders'
  AND trigger_name = 'manage_inventory_trigger';

-- 2. Check if function exists
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'manage_inventory_on_order';

-- 3. Test the function manually (replace with actual product_id and variant data)
-- This will help us see if the function works when called directly
DO $$
DECLARE
    test_items jsonb := '[
        {
            "product_id": "9e9b9080-3045-4d32-9584-b50f17e41cd4",
            "quantity": 3,
            "size": "M",
            "color": null
        }
    ]'::jsonb;
    item jsonb;
    prod_id uuid;
    qty int;
    item_size text;
    item_color text;
    available_stock int;
    variant_id uuid;
    has_variants boolean;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(test_items)
    LOOP
        prod_id := (item->>'product_id')::uuid;
        qty := (item->>'quantity')::int;
        item_size := item->>'size';
        item_color := item->>'color';
        
        RAISE NOTICE 'Testing product: %, qty: %, size: %, color: %', 
            prod_id, qty, item_size, item_color;
        
        -- Check if product has variants
        SELECT EXISTS(SELECT 1 FROM product_variants WHERE product_id = prod_id) 
        INTO has_variants;
        
        RAISE NOTICE 'Has variants: %', has_variants;
        
        IF has_variants THEN
            SELECT id, stock_quantity INTO variant_id, available_stock
            FROM product_variants
            WHERE product_id = prod_id
              AND (size IS NOT DISTINCT FROM item_size)
              AND (color IS NOT DISTINCT FROM item_color);
            
            RAISE NOTICE 'Variant ID: %, Available stock: %', variant_id, available_stock;
            
            IF available_stock < qty THEN
                RAISE NOTICE 'WOULD BLOCK: Insufficient stock (available: %, requested: %)', 
                    available_stock, qty;
            ELSE
                RAISE NOTICE 'WOULD ALLOW: Sufficient stock';
            END IF;
        END IF;
    END LOOP;
END $$;
