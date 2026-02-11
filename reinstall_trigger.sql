-- Script to completely reinstall the inventory trigger
-- Run this if the trigger is not working

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS manage_inventory_trigger ON orders;
DROP FUNCTION IF EXISTS manage_inventory_on_order();

-- 2. Recreate the function
CREATE OR REPLACE FUNCTION manage_inventory_on_order()
RETURNS TRIGGER AS $$
DECLARE
    item jsonb;
    prod_id uuid;
    qty int;
    item_size text;
    item_color text;
    available_stock int;
    prod_name text;
    variant_id uuid;
    has_variants boolean;
BEGIN
    -- Loop through items in the JSON array
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
        prod_id := (item->>'product_id')::uuid;
        qty := (item->>'quantity')::int;
        item_size := item->>'size';
        item_color := item->>'color';
        
        -- Get product name and check if it has variants
        SELECT name, EXISTS(SELECT 1 FROM product_variants WHERE product_id = prod_id) 
        INTO prod_name, has_variants 
        FROM products 
        WHERE id = prod_id;
        
        IF prod_name IS NULL THEN
            RAISE EXCEPTION 'المنتج غير موجود (ID: %)', prod_id;
        END IF;
        
        -- If product has variants, check variant stock
        IF has_variants THEN
            -- Find matching variant
            SELECT id, stock_quantity INTO variant_id, available_stock
            FROM product_variants
            WHERE product_id = prod_id
              AND (size IS NOT DISTINCT FROM item_size)
              AND (color IS NOT DISTINCT FROM item_color);
            
            IF variant_id IS NULL THEN
                RAISE EXCEPTION 'عذراً، المقاس "%s" واللون "%s" غير متوفر للمنتج "%s"', 
                    COALESCE(item_size, 'غير محدد'), 
                    COALESCE(item_color, 'غير محدد'), 
                    prod_name;
            END IF;
            
            IF available_stock < qty THEN
                RAISE EXCEPTION 'عذراً، المخزون غير كافٍ للمنتج "%s" (المقاس: %s، اللون: %s). المتوفر: %s، المطلوب: %s', 
                    prod_name, 
                    COALESCE(item_size, 'غير محدد'), 
                    COALESCE(item_color, 'غير محدد'), 
                    available_stock, 
                    qty;
            END IF;
            
            -- Deduct from variant stock
            UPDATE product_variants
            SET stock_quantity = stock_quantity - qty
            WHERE id = variant_id;
            
        ELSE
            -- No variants, check product-level stock
            SELECT stock_quantity INTO available_stock
            FROM products
            WHERE id = prod_id;

            IF available_stock < qty THEN
                RAISE EXCEPTION 'عذراً، المخزون غير كافٍ للمنتج "%s". المتوفر: %s، المطلوب: %s', 
                    prod_name, available_stock, qty;
            END IF;

            -- Deduct from product stock
            UPDATE products
            SET stock_quantity = stock_quantity - qty
            WHERE id = prod_id;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
CREATE TRIGGER manage_inventory_trigger
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION manage_inventory_on_order();

-- 4. Verify installation
SELECT 'Trigger installed successfully!' as status;
