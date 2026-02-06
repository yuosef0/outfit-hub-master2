-- Add governorate column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS governorate VARCHAR;

-- Create slider_images table
CREATE TABLE IF NOT EXISTS slider_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title VARCHAR,
  description TEXT,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  name_ar VARCHAR,
  description TEXT,
  image_url TEXT,
  icon VARCHAR,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE slider_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'slider_images' AND policyname = 'Anyone can view active slider images'
  ) THEN
    CREATE POLICY "Anyone can view active slider images" ON slider_images 
      FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Anyone can view active categories'
  ) THEN
    CREATE POLICY "Anyone can view active categories" ON categories 
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- Insert Slider Images
INSERT INTO slider_images (image_url, title, description, display_order, is_active) 
VALUES
  ('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=600&fit=crop', 'Summer Collection 2026', 'Discover the latest trends', 1, true),
  ('https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=600&fit=crop', 'New Arrivals', 'Fresh styles just landed', 2, true),
  ('https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=600&fit=crop', 'Fashion Week Special', 'Exclusive designer pieces', 3, true),
  ('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=600&fit=crop', 'Accessories Collection', 'Complete your look', 4, true),
  ('https://images.unsplash.com/photo-1558769132-cb1aea1c8347?w=1200&h=600&fit=crop', 'Footwear Essentials', 'Step into style', 5, true)
ON CONFLICT DO NOTHING;

-- Insert Categories
INSERT INTO categories (name, name_ar, description, image_url, display_order) 
VALUES
  ('Clothing', 'ملابس', 'Latest fashion clothing for all occasions', 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=400&fit=crop', 1),
  ('Shoes', 'أحذية', 'Footwear for every style', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop', 2),
  ('Accessories', 'إكسسوارات', 'Complete your outfit with accessories', 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=400&h=400&fit=crop', 3),
  ('Bags', 'حقائب', 'Stylish bags and backpacks', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop', 4),
  ('Watches', 'ساعات', 'Elegant timepieces', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', 5),
  ('Jewelry', 'مجوهرات', 'Beautiful jewelry pieces', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop', 6)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_slider_images_active ON slider_images(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC) WHERE is_active = true;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Database seeded successfully!';
  RAISE NOTICE 'Slider images: %', (SELECT COUNT(*) FROM slider_images);
  RAISE NOTICE 'Categories: %', (SELECT COUNT(*) FROM categories);
  RAISE NOTICE '=================================';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: To add sample stores and products:';
  RAISE NOTICE '1. Create merchant accounts through Supabase Auth';
  RAISE NOTICE '2. Or use the Supabase Dashboard to manually add stores';
  RAISE NOTICE '3. Then run the products insert script';
  RAISE NOTICE '';
  RAISE NOTICE 'For now, you can test with the slider and categories!';
END $$;
