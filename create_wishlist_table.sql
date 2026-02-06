-- Drop existing policies first to avoid dependencies
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can add to their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON public.wishlist;

-- Drop table if exists to recreate it properly
DROP TABLE IF EXISTS public.wishlist;

-- Create Wishlist Table
CREATE TABLE public.wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Changed to auth.users just in case, but usually public.users is better if it syncs
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own wishlist" 
ON public.wishlist FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist" 
ON public.wishlist FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist" 
ON public.wishlist FOR DELETE 
USING (auth.uid() = user_id);
