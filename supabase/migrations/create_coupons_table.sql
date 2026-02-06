-- Migration: Create coupons table
-- Description: Creates coupons table for merchant discount codes

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    min_order_amount DECIMAL(10,2) CHECK (min_order_amount >= 0),
    max_uses INTEGER CHECK (max_uses > 0),
    current_uses INTEGER DEFAULT 0 CHECK (current_uses >= 0),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coupons_store ON coupons(store_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for merchants
CREATE POLICY "Merchants can manage their store coupons"
    ON coupons FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = coupons.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- RLS Policy for customers to view active coupons
CREATE POLICY "Customers can view active coupons"
    ON coupons FOR SELECT
    USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Create trigger for updated_at
CREATE TRIGGER update_coupons_updated_at_trigger
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION validate_coupon(
    p_code VARCHAR(50),
    p_store_id UUID,
    p_order_amount DECIMAL(10,2)
)
RETURNS TABLE(
    valid BOOLEAN,
    discount_amount DECIMAL(10,2),
    message TEXT
) AS $$
DECLARE
    v_coupon RECORD;
    v_discount DECIMAL(10,2);
BEGIN
    -- Find the coupon
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = p_code
    AND store_id = p_store_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1;

    -- Check if coupon exists
    IF v_coupon IS NULL THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10,2), 'Invalid or expired coupon code'::TEXT;
        RETURN;
    END IF;

    -- Check max uses
    IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10,2), 'Coupon usage limit reached'::TEXT;
        RETURN;
    END IF;

    -- Check minimum order amount
    IF v_coupon.min_order_amount IS NOT NULL AND p_order_amount < v_coupon.min_order_amount THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10,2), 
            format('Minimum order amount is %s EGP', v_coupon.min_order_amount)::TEXT;
        RETURN;
    END IF;

    -- Calculate discount
    IF v_coupon.discount_type = 'percentage' THEN
        v_discount := p_order_amount * (v_coupon.discount_value / 100);
    ELSE
        v_discount := v_coupon.discount_value;
    END IF;

    -- Ensure discount doesn't exceed order amount
    IF v_discount > p_order_amount THEN
        v_discount := p_order_amount;
    END IF;

    RETURN QUERY SELECT true, v_discount, 'Coupon applied successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE coupons IS 'Discount coupons created by merchants';
COMMENT ON COLUMN coupons.discount_type IS 'Type of discount: percentage or fixed amount';
COMMENT ON COLUMN coupons.current_uses IS 'Number of times this coupon has been used';
