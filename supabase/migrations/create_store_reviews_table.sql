-- Migration: Create store reviews table
-- Description: Creates table for customer reviews of stores with merchant reply capability

-- Create store_reviews table
CREATE TABLE IF NOT EXISTS store_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    merchant_reply TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id, customer_id, store_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_store_reviews_store ON store_reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_store_reviews_customer ON store_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_store_reviews_rating ON store_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_store_reviews_created_at ON store_reviews(created_at DESC);

-- Enable Row Level Security
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policy for customers to view all reviews
CREATE POLICY "Anyone can view store reviews"
    ON store_reviews FOR SELECT
    USING (true);

-- RLS Policy for customers to create reviews for their completed orders
CREATE POLICY "Customers can create reviews for their orders"
    ON store_reviews FOR INSERT
    WITH CHECK (
        auth.uid() = customer_id
        AND EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_id
            AND orders.customer_id = auth.uid()
            AND orders.status = 'completed'
        )
    );

-- RLS Policy for customers to update their own reviews
CREATE POLICY "Customers can update their own reviews"
    ON store_reviews FOR UPDATE
    USING (auth.uid() = customer_id)
    WITH CHECK (auth.uid() = customer_id);

-- RLS Policy for merchants to reply to reviews
CREATE POLICY "Merchants can reply to their store reviews"
    ON store_reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = store_reviews.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_store_reviews_updated_at_trigger
    BEFORE UPDATE ON store_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update store average rating
CREATE OR REPLACE FUNCTION update_store_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    -- Calculate average rating for the store
    SELECT 
        COALESCE(AVG(rating), 0)::DECIMAL(3,2),
        COUNT(*)
    INTO avg_rating, review_count
    FROM store_reviews
    WHERE store_id = COALESCE(NEW.store_id, OLD.store_id);

    -- Update store rating (assuming stores table has rating column)
    UPDATE stores
    SET 
        rating = avg_rating,
        review_count = review_count
    WHERE id = COALESCE(NEW.store_id, OLD.store_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update store rating
CREATE TRIGGER update_store_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON store_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_store_rating();

-- Add rating and review_count columns to stores table if they don't exist
ALTER TABLE stores ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

COMMENT ON TABLE store_reviews IS 'Customer reviews and ratings for stores';
COMMENT ON COLUMN store_reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN store_reviews.merchant_reply IS 'Store owner reply to the review';
