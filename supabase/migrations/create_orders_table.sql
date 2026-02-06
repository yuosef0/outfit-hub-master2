-- Migration: Create orders table
-- Description: Creates orders table for managing customer reservations and purchases

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    pickup_code VARCHAR(6) NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'confirmed', 'ready', 'completed', 'cancelled', 'expired')),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0),
    items JSONB NOT NULL,
    notes TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON orders(pickup_code);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Customers can view their own orders"
    ON orders FOR SELECT
    USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert their own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own pending orders"
    ON orders FOR UPDATE
    USING (auth.uid() = customer_id AND status IN ('reserved', 'confirmed'));

-- RLS Policies for merchants
CREATE POLICY "Merchants can view their store orders"
    ON orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = orders.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

CREATE POLICY "Merchants can update their store orders"
    ON orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = orders.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- Create function to generate unique pickup code
CREATE OR REPLACE FUNCTION generate_pickup_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    new_code VARCHAR(6);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random 6-digit code
        new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM orders WHERE pickup_code = new_code) INTO code_exists;
        
        -- Exit loop if code is unique
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE orders IS 'Customer orders and reservations';
COMMENT ON COLUMN orders.pickup_code IS 'Unique 6-digit code for order pickup verification';
COMMENT ON COLUMN orders.status IS 'Order status: reserved, confirmed, ready, completed, cancelled, expired';
COMMENT ON COLUMN orders.items IS 'JSON array of order items with product details, quantities, sizes, colors';
COMMENT ON COLUMN orders.expires_at IS 'Reservation expiry time (48 hours from creation)';
