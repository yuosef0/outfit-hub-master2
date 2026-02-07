-- Notifications System Migration
-- Run this in Supabase SQL Editor

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('new_product', 'price_drop', 'new_coupon', 'general')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 2. Function to Notify Store Followers (Bulk Insert)
CREATE OR REPLACE FUNCTION notify_store_followers(
    p_store_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_link TEXT,
    p_type TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO notifications (user_id, store_id, title, message, link, type)
    SELECT 
        user_id,
        p_store_id,
        p_title,
        p_message,
        p_link,
        p_type
    FROM store_follows
    WHERE store_id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for New Products
CREATE OR REPLACE FUNCTION on_product_created()
RETURNS TRIGGER AS $$
DECLARE
    store_name TEXT;
BEGIN
    IF NEW.is_active = true THEN
        SELECT name INTO store_name FROM stores WHERE id = NEW.store_id;
        
        PERFORM notify_store_followers(
            NEW.store_id,
            'منتج جديد من ' || store_name,
            'تمت إضافة منتج جديد: ' || NEW.name,
            '/products/' || NEW.id,
            'new_product'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_product
    AFTER INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION on_product_created();

-- 4. Trigger for Price Drops
CREATE OR REPLACE FUNCTION on_product_price_drop()
RETURNS TRIGGER AS $$
DECLARE
    store_name TEXT;
BEGIN
    -- Only notify if price decreased and product is active
    IF NEW.is_active = true AND NEW.price < OLD.price THEN
        SELECT name INTO store_name FROM stores WHERE id = NEW.store_id;
        
        PERFORM notify_store_followers(
            NEW.store_id,
            'تخفيض السعر في ' || store_name,
            'تم تخفيض سعر ' || NEW.name || ' إلى ' || NEW.price || ' ج.م',
            '/products/' || NEW.id,
            'price_drop'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_price_drop
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION on_product_price_drop();

-- Success Message
DO $$
BEGIN
    RAISE NOTICE 'Notifications system setup completed successfully!';
END $$;
