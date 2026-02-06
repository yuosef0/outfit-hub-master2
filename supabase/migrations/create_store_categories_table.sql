-- Migration: Create store categories table
-- Description: Creates table for store product categories (e.g., Men's, Women's, Kids, etc.)

-- Create store_categories table
CREATE TABLE IF NOT EXISTS store_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_store_categories_store ON store_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_store_categories_active ON store_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_store_categories_order ON store_categories(store_id, display_order);

-- Enable Row Level Security
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy for anyone to view active categories
CREATE POLICY "Anyone can view active store categories"
    ON store_categories FOR SELECT
    USING (is_active = true);

-- RLS Policy for merchants to view their own categories (including inactive)
CREATE POLICY "Merchants can view all their store categories"
    ON store_categories FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = store_categories.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- RLS Policy for merchants to create categories
CREATE POLICY "Merchants can create store categories"
    ON store_categories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- RLS Policy for merchants to update their categories
CREATE POLICY "Merchants can update their store categories"
    ON store_categories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = store_categories.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- RLS Policy for merchants to delete their categories
CREATE POLICY "Merchants can delete their store categories"
    ON store_categories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = store_categories.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_store_categories_updated_at_trigger
    BEFORE UPDATE ON store_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add category_id column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES store_categories(id) ON DELETE SET NULL;

-- Create index for products category
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

COMMENT ON TABLE store_categories IS 'Product categories for stores (e.g., Men, Women, Kids)';
COMMENT ON COLUMN store_categories.name IS 'Category name in English';
COMMENT ON COLUMN store_categories.name_ar IS 'Category name in Arabic';
COMMENT ON COLUMN store_categories.display_order IS 'Order to display categories (lower numbers first)';
