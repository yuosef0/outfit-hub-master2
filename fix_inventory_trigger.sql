-- Function to manage inventory when an order is created
-- This checks stock and deducts it for all items in the order
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
BEGIN
    -- Loop through items in the JSON array
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
        prod_id := (item->>'product_id')::uuid;
        qty := (item->>'quantity')::int;
        item_size := item->>'size';
        item_color := item->>'color';
        
        -- Get product name
        SELECT name INTO prod_name FROM products WHERE id = prod_id;
        
        IF prod_name IS NULL THEN
            RAISE EXCEPTION 'Product with ID % not found', prod_id;
        END IF;
        
        -- Check if this is a variant-based product (has size or color)
        IF item_size IS NOT NULL OR item_color IS NOT NULL THEN
            -- Check variant stock
            SELECT id, stock_quantity INTO variant_id, available_stock
            FROM product_variants
            WHERE product_id = prod_id
              AND (size = item_size OR (size IS NULL AND item_size IS NULL))
              AND (color = item_color OR (color IS NULL AND item_color IS NULL));
            
            IF variant_id IS NULL THEN
                RAISE EXCEPTION 'عذراً، المقاس/اللون المطلوب غير متوفر للمنتج "%"', prod_name;
            END IF;
            
            IF available_stock < qty THEN
                RAISE EXCEPTION 'عذراً، المخزون غير كافٍ للمنتج "%" (المقاس: %, اللون: %). المتوفر: %، المطلوب: %', 
                    prod_name, COALESCE(item_size, 'غير محدد'), COALESCE(item_color, 'غير محدد'), available_stock, qty;
            END IF;
            
            -- Deduct from variant stock
            UPDATE product_variants
            SET stock_quantity = stock_quantity - qty
            WHERE id = variant_id;
        ELSE
            -- Check product-level stock (no variants)
            SELECT stock_quantity INTO available_stock
            FROM products
            WHERE id = prod_id;

            IF available_stock < qty THEN
                RAISE EXCEPTION 'عذراً، المخزون غير كافٍ للمنتج "%". المتوفر: %، المطلوب: %', prod_name, available_stock, qty;
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

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS manage_inventory_trigger ON orders;

-- Create trigger on orders table
CREATE TRIGGER manage_inventory_trigger
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION manage_inventory_on_order();

-- Also handle order_items table if it exists (for API route compatibility)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
        
        -- Function to check stock BEFORE inserting an order item
        CREATE OR REPLACE FUNCTION check_stock_before_order_item()
        RETURNS TRIGGER AS $inner$
        DECLARE
            available_stock INTEGER;
            product_name TEXT;
        BEGIN
            SELECT stock_quantity, name INTO available_stock, product_name
            FROM products
            WHERE id = NEW.product_id;

            IF available_stock IS NULL THEN
                RAISE EXCEPTION 'Product with ID % not found', NEW.product_id;
            END IF;

            IF available_stock < NEW.quantity THEN
                RAISE EXCEPTION 'عذراً، المخزون غير كافٍ للمنتج "%". المتوفر: %، المطلوب: %', product_name, available_stock, NEW.quantity;
            END IF;

            RETURN NEW;
        END;
        $inner$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Function to deduct stock AFTER inserting an order item
        CREATE OR REPLACE FUNCTION deduct_stock_after_order_item()
        RETURNS TRIGGER AS $inner$
        BEGIN
            UPDATE products
            SET stock_quantity = stock_quantity - NEW.quantity
            WHERE id = NEW.product_id;
            
            RETURN NEW;
        END;
        $inner$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Triggers for order_items
        DROP TRIGGER IF EXISTS check_stock_trigger ON order_items;
        CREATE TRIGGER check_stock_trigger
        BEFORE INSERT ON order_items
        FOR EACH ROW
        EXECUTE FUNCTION check_stock_before_order_item();

        DROP TRIGGER IF EXISTS deduct_stock_trigger ON order_items;
        CREATE TRIGGER deduct_stock_trigger
        AFTER INSERT ON order_items
        FOR EACH ROW
        EXECUTE FUNCTION deduct_stock_after_order_item();
        
    END IF;
END $$;

