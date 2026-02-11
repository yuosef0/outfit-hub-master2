-- Add district column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS district TEXT;

-- Add comment
COMMENT ON COLUMN users.district IS 'User selected district within their governorate';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_district ON users(district);
