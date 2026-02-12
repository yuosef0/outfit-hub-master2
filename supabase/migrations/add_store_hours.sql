-- Add operating hours to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS opening_time TEXT DEFAULT '09:00';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS closing_time TEXT DEFAULT '21:00';
