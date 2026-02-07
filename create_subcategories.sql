-- Create subcategories table
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add subcategory_id to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Enable RLS on subcategories
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Policies for subcategories
-- Everyone can view subcategories
CREATE POLICY "Everyone can view subcategories" ON public.subcategories
    FOR SELECT TO public USING (true);

-- Only admins can insert/update/delete subcategories
CREATE POLICY "Admins can manage subcategories" ON public.subcategories
    FOR ALL TO authenticated
    USING (
        EXISTS (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
        )
    );
