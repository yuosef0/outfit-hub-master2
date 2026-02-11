-- Create districts table
CREATE TABLE IF NOT EXISTS districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    governorate_code TEXT NOT NULL,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add district column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS district TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_districts_governorate ON districts(governorate_code);
CREATE INDEX IF NOT EXISTS idx_stores_district ON stores(district);

-- Enable RLS
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for districts
DROP POLICY IF EXISTS "Anyone can view active districts" ON districts;
CREATE POLICY "Anyone can view active districts" ON districts
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage districts" ON districts;
CREATE POLICY "Admins can manage districts" ON districts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );
