-- Store Branches Table
-- Allows merchants to add multiple branch locations for their store
-- Products remain shared across all branches (linked to the main store)

CREATE TABLE IF NOT EXISTS store_branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    governorate TEXT NOT NULL,
    district TEXT,
    phone TEXT,
    maps_link TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one branch per governorate+district per store
CREATE UNIQUE INDEX idx_store_branch_location
    ON store_branches(store_id, governorate, COALESCE(district, ''));

-- Performance indexes
CREATE INDEX idx_store_branches_store ON store_branches(store_id);
CREATE INDEX idx_store_branches_governorate ON store_branches(governorate);
CREATE INDEX idx_store_branches_gov_district ON store_branches(governorate, district);

-- Enable RLS
ALTER TABLE store_branches ENABLE ROW LEVEL SECURITY;

-- Anyone can view active branches
CREATE POLICY "Anyone can view active branches" ON store_branches
    FOR SELECT USING (is_active = true);

-- Merchants can insert branches for their own stores
CREATE POLICY "Merchants can insert branches" ON store_branches
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = store_branches.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- Merchants can update their own store branches
CREATE POLICY "Merchants can update their branches" ON store_branches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = store_branches.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- Merchants can delete their own store branches
CREATE POLICY "Merchants can delete their branches" ON store_branches
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = store_branches.store_id
            AND stores.merchant_id = auth.uid()
        )
    );
