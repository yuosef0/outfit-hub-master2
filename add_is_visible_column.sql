-- Add is_visible column to stores table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'is_visible') THEN
        ALTER TABLE stores ADD COLUMN is_visible BOOLEAN DEFAULT TRUE;
    END IF;
END $$;
