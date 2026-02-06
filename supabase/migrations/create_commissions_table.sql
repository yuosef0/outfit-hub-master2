-- Migration: Create commissions table
-- Description: Creates commissions table to track 3% commission on completed orders

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_commissions_store ON commissions(store_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy for merchants to view their commissions
CREATE POLICY "Merchants can view their store commissions"
    ON commissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = commissions.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- Function to automatically create commission when order is completed
CREATE OR REPLACE FUNCTION create_commission_on_order_complete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create commission when order status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        INSERT INTO commissions (order_id, store_id, amount, status)
        VALUES (NEW.id, NEW.store_id, NEW.commission_amount, 'pending')
        ON CONFLICT (order_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create commission
CREATE TRIGGER create_commission_trigger
    AFTER INSERT OR UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_commission_on_order_complete();

COMMENT ON TABLE commissions IS 'Commission records for completed orders (3% of order total)';
COMMENT ON COLUMN commissions.status IS 'Commission payment status: pending or paid';
COMMENT ON COLUMN commissions.amount IS 'Commission amount (3% of order total)';
