-- ============================================================
-- Inventory Deduction + Customer Notification on Order Completion
-- Run this script in Supabase SQL Editor
-- ============================================================

-- Step 1: Remove the old INSERT trigger (deducted on reservation — incorrect behavior)
DROP TRIGGER IF EXISTS manage_inventory_trigger ON orders;
DROP FUNCTION IF EXISTS manage_inventory_on_order() CASCADE;

-- Step 2: Create the function that runs when an order is marked as completed
CREATE OR REPLACE FUNCTION handle_order_completion()
RETURNS TRIGGER AS $$
DECLARE
    item          jsonb;
    prod_id       uuid;
    qty           int;
    item_size     text;
    item_color    text;
    variant_id    uuid;
    store_name    text;
BEGIN
    -- Only fire when status transitions TO 'completed'
    IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN

        -- ── 1. Deduct inventory per order item ──────────────────────────
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            prod_id    := (item->>'product_id')::uuid;
            qty        := COALESCE((item->>'quantity')::int, 1);
            item_size  := NULLIF(TRIM(item->>'size'), '');
            item_color := NULLIF(TRIM(item->>'color'), '');

            -- Look for a matching variant (size + color)
            SELECT id INTO variant_id
            FROM product_variants
            WHERE product_id = prod_id
              AND (size  IS NOT DISTINCT FROM item_size)
              AND (color IS NOT DISTINCT FROM item_color)
            LIMIT 1;

            IF variant_id IS NOT NULL THEN
                -- Deduct from variant stock (never go below 0)
                UPDATE product_variants
                SET stock_quantity = GREATEST(0, stock_quantity - qty)
                WHERE id = variant_id;
            ELSE
                -- Fallback: deduct from product-level stock
                UPDATE products
                SET stock_quantity = GREATEST(0, stock_quantity - qty)
                WHERE id = prod_id;
            END IF;
        END LOOP;

        -- ── 2. Send thank-you notification to the customer ───────────────
        SELECT name INTO store_name FROM stores WHERE id = NEW.store_id;

        INSERT INTO notifications (user_id, store_id, type, title, message, link, is_read)
        VALUES (
            NEW.customer_id,
            NEW.store_id,
            'general',
            '✅ تم استلام طلبك بنجاح!',
            'شكراً لك ' || COALESCE(NEW.customer_name, '') || '! تم تسليم طلبك من متجر ' ||
                COALESCE(store_name, 'المتجر') || ' بنجاح. نتمنى أن تكون راضياً عن تجربتك معنا 💙',
            '/orders',
            false
        );

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger on the orders table (fires AFTER UPDATE)
DROP TRIGGER IF EXISTS handle_order_completion_trigger ON orders;

CREATE TRIGGER handle_order_completion_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_completion();

-- Verify installation
SELECT 'handle_order_completion_trigger installed successfully!' AS status;
