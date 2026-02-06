-- Store Follows Table
-- Run this SQL in your Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS store_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- Enable RLS
ALTER TABLE store_follows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view follow counts" ON store_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow stores" ON store_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow stores" ON store_follows
  FOR DELETE USING (auth.uid() = user_id);
