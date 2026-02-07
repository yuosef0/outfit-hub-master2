-- DEBUGGING SCRIPT
-- Temporarily disable RLS on products to rule out permission issues

ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- If this fixes the issue, we know the RLS policies were the problem.
-- We can re-enable them later with: ALTER TABLE products ENABLE ROW LEVEL SECURITY;
