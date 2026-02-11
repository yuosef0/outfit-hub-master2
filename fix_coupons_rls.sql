-- Enable RLS on coupons table
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Policy for Admins (can do everything)
DROP POLICY IF EXISTS "Admins can do everything on coupons" ON coupons;
CREATE POLICY "Admins can do everything on coupons" ON coupons
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role = 'admin'
        )
    );

-- Policy for Merchants (can view and create coupons for their own store)
DROP POLICY IF EXISTS "Merchants can view their own coupons" ON coupons;
CREATE POLICY "Merchants can view their own coupons" ON coupons
    FOR SELECT
    USING (
        store_id IN (
            SELECT id FROM stores WHERE merchant_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Merchants can insert coupons for their own store" ON coupons;
CREATE POLICY "Merchants can insert coupons for their own store" ON coupons
    FOR INSERT
    WITH CHECK (
        store_id IN (
            SELECT id FROM stores WHERE merchant_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Merchants can update their own coupons" ON coupons;
CREATE POLICY "Merchants can update their own coupons" ON coupons
    FOR UPDATE
    USING (
        store_id IN (
            SELECT id FROM stores WHERE merchant_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Merchants can delete their own coupons" ON coupons;
CREATE POLICY "Merchants can delete their own coupons" ON coupons
    FOR DELETE
    USING (
        store_id IN (
            SELECT id FROM stores WHERE merchant_id = auth.uid()
        )
    );

-- Policy for Customers (can view active coupons)
DROP POLICY IF EXISTS "Customers can view active coupons" ON coupons;
CREATE POLICY "Customers can view active coupons" ON coupons
    FOR SELECT
    USING (
        is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
    );
