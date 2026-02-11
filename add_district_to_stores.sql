-- Add district column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS district TEXT;

-- Add comment
COMMENT ON COLUMN stores.district IS 'Store district within the governorate';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_stores_district ON stores(district);
