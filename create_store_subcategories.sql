-- Create stored procedures/functions for managing store subcategories
-- This is a junction table for Many-to-Many relationship between Stores and Subcategories

CREATE TABLE IF NOT EXISTS public.store_subcategories (
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (store_id, subcategory_id)
);

-- Enable RLS
ALTER TABLE public.store_subcategories ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view store subcategories (for filtering stores)
CREATE POLICY "Everyone can view store_subcategories" ON public.store_subcategories
    FOR SELECT TO public USING (true);

-- Merchants can insert/delete their own store subcategories
CREATE POLICY "Merchants can manage their own store_subcategories" ON public.store_subcategories
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = store_subcategories.store_id
            AND stores.merchant_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = store_subcategories.store_id
            AND stores.merchant_id = auth.uid()
        )
    );
