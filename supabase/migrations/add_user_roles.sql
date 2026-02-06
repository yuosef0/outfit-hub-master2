-- Migration: Add user roles
-- Description: Adds role column to users table to support customer, merchant, and admin roles

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'merchant', 'admin'));

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have customer role (if not set)
UPDATE users SET role = 'customer' WHERE role IS NULL;

COMMENT ON COLUMN users.role IS 'User role: customer, merchant, or admin';
