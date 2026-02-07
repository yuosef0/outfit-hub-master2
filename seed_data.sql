-- Clear existing data
-- TRUNCATE TABLE store_categories, store_subcategories, subcategories, categories, products, stores, users CASCADE;
-- DELETE FROM auth.users WHERE email LIKE '%@store.com';

-- 1. Insert Categories
INSERT INTO categories (id, name, name_ar, icon, display_order, is_active, image_url) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fashion', 'أزياء', 'apparel', 1, true, 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Electronics', 'إلكترونيات', 'devices', 2, true, 'https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Home & Living', 'منزل وديكور', 'chair', 3, true, 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Beauty & Health', 'جمال وصحة', 'face', 4, true, 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Sports & Fitness', 'رياضة ولياقة', 'fitness_center', 5, true, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Kids & Toys', 'أطفال وألعاب', 'child_care', 6, true, 'https://images.unsplash.com/photo-1566576912906-25433af57075?auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Groceries', 'بقالة', 'shopping_basket', 7, true, 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Books & Stationery', 'كتب وقرطاسية', 'menu_book', 8, true, 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET 
name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, icon = EXCLUDED.icon, image_url = EXCLUDED.image_url;

-- 2. Insert Subcategories
INSERT INTO subcategories (id, category_id, name, name_ar) VALUES
-- Fashion (cat: ...11)
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Men', 'رجالي'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Women', 'حريمي'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kids', 'أطفال'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Shoes', 'أحذية'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bags & Accessories', 'شنط وإكسسوارات'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b06', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Jewelry', 'مجوهرات'),

-- Electronics (cat: ...12)
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Mobile Phones', 'موبايلات'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Laptops', 'لابتوب'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Cameras', 'كاميرات'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Accessories', 'إكسسوارات'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Gaming', 'ألعاب فيديو'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Audio', 'صوتيات'),

-- Home (cat: ...13)
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Furniture', 'أثاث'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Decor', 'ديكور'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b23', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Kitchenware', 'أدوات مطبخ'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b24', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Bedding', 'مفروشات'),

-- Beauty (cat: ...14)
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b31', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Makeup', 'مكياج'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b32', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Skincare', 'عناية بالبشرة'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Perfumes', 'عطور'),

-- Sports (cat: ...15)
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b41', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Gym Equipment', 'أجهزة رياضية'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b42', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Sportswear', 'ملابس رياضية'),

-- Kids (cat: ...16)
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b51', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Toys', 'ألعاب'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b52', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Baby Gear', 'مستلزمات أطفال'),

-- Groceries (cat: ...17)
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b61', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Fresh Food', 'طعام طازج'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b62', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Beverages', 'مشروبات'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b63', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Snacks', 'سناكس'),

-- Books (cat: ...18)
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b71', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Fiction', 'روايات'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b72', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Non-fiction', 'كتب عامة')
ON CONFLICT (id) DO UPDATE SET 
name = EXCLUDED.name, name_ar = EXCLUDED.name_ar;


-- ==========================================
-- BATCH 1 (Original Data)
-- ==========================================

-- 3a. Insert into auth.users (Correctly handling passwords and timestamps)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
VALUES 
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', '00000000-0000-0000-0000-000000000000', 'fashion@store.com', crypt('password123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', NOW(), NOW()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', '00000000-0000-0000-0000-000000000000', 'tech@store.com', crypt('password123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', NOW(), NOW()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', '00000000-0000-0000-0000-000000000000', 'home@store.com', crypt('password123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', NOW(), NOW()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', '00000000-0000-0000-0000-000000000000', 'beauty@store.com', crypt('password123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', NOW(), NOW()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', '00000000-0000-0000-0000-000000000000', 'sport@store.com', crypt('password123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3b. Insert into public.users
INSERT INTO users (id, email, full_name, role, governorate) VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'fashion@store.com', 'Zara Fashion Owner', 'merchant', 'Minya'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'tech@store.com', 'Tech Hub Owner', 'merchant', 'Minya'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'home@store.com', 'Ikea Home Owner', 'merchant', 'Minya'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 'beauty@store.com', 'Sephora Beauty Owner', 'merchant', 'Minya'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 'sport@store.com', 'Nike Sports Owner', 'merchant', 'Minya')
ON CONFLICT (id) DO UPDATE SET role = 'merchant', governorate = 'Minya';

-- 4. Insert Stores
INSERT INTO stores (id, merchant_id, name, description, address, phone, category, governorate, subscription_plan, is_active, logo_url, banner_url) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'Zara Fashion', 'High street fashion', 'Nile Corniche, Minya', '01000000001', 'Fashion', 'Minya', 'premium', true, 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'Tech Hub', 'Latest gadgets', 'Taha Hussein St, Minya', '01000000002', 'Electronics', 'Minya', 'standard', true, 'https://images.unsplash.com/photo-1531297461136-82lw9z0u9b8a?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'Modern Home', 'Furniture', 'El Gomhoreya St, Minya', '01000000003', 'Home & Living', 'Minya', 'premium', true, 'https://images.unsplash.com/photo-1616486338812-3a47f66be2d0?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 'Beauty Palace', 'Cosmetics', 'Adnan El Malky St, Minya', '01000000004', 'Beauty & Health', 'Minya', 'standard', true, 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?auto=format&fit=crop&q=80'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d05', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 'Active Sports', 'Just Do It', 'Minya Club St, Minya', '01000000005', 'Sports & Fitness', 'Minya', 'premium', true, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, governorate = 'Minya';

INSERT INTO store_subcategories (store_id, subcategory_id) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01'), -- Zara -> Men
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02'), -- Zara -> Women
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11'), -- Tech -> Phones
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b21'), -- Ike -> Furniture
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b31'), -- Sephora -> Makeup
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d05', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b41')  -- Nike -> Gym
ON CONFLICT DO NOTHING;

INSERT INTO store_categories (id, store_id, name, name_ar, display_order, is_active) VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01', 'New Arrivals', 'وصل حديثاً', 1, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01', 'Men', 'رجالي', 2, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e03', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02', 'Smartphones', 'هواتف ذكية', 1, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e04', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03', 'Living Room', 'غرفة المعيشة', 1, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e05', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04', 'Makeup', 'مكياج', 1, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e06', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d05', 'Shoes', 'أحذية', 1, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO products (id, store_id, name, description, price, category, stock_quantity, is_active, created_at, updated_at, image_urls) VALUES
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01', 'Classic White Shirt', 'Cotton shirt', 899.00, 'Men', 50, true, NOW(), NOW(), ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80']),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02', 'iPhone 15 Pro', 'Titanium', 55000.00, 'Smartphones', 10, true, NOW(), NOW(), ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80']),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03', 'Modern Sofa', 'Grey Sofa', 15999.00, 'Living Room', 5, true, NOW(), NOW(), ARRAY['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80']),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f04', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04', 'Matte Lipstick', 'Red', 950.00, 'Makeup', 100, true, NOW(), NOW(), ARRAY['https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80']),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d05', 'Air Max 90', 'Running shoes', 6500.00, 'Shoes', 12, true, NOW(), NOW(), ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80'])
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price;

-- ==========================================
-- BATCH 2 (Copy 1 - Minya)
-- ==========================================

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
VALUES
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', '00000000-0000-0000-0000-000000000000', 'fashion_c1@store.com', crypt('password123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', NOW(), NOW()),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', '00000000-0000-0000-0000-000000000000', 'tech_c1@store.com', crypt('password123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', NOW(), NOW()),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', '00000000-0000-0000-0000-000000000000', 'home_c1@store.com', crypt('password123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, full_name, role, governorate) VALUES
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'fashion_c1@store.com', 'H&M Style Owner', 'merchant', 'Minya'),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'tech_c1@store.com', 'Computer Shop Owner', 'merchant', 'Minya'),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 'home_c1@store.com', 'Home Centre Owner', 'merchant', 'Minya')
ON CONFLICT (id) DO UPDATE SET role = 'merchant', governorate = 'Minya';

INSERT INTO stores (id, merchant_id, name, description, address, phone, category, governorate, subscription_plan, is_active, logo_url, banner_url) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'H&M Style', 'Trendy fashion', 'Sus Street, Minya', '01000000011', 'Fashion', 'Minya', 'standard', true, 'https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'Computer Shop', 'PC building', 'ShalabySt, Minya', '01000000012', 'Electronics', 'Minya', 'premium', true, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 'Home Centre', 'Affordable furniture', 'Minya University Rd, Minya', '01000000013', 'Home & Living', 'Minya', 'standard', true, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, governorate = 'Minya';

INSERT INTO store_subcategories (store_id, subcategory_id) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b21')
ON CONFLICT DO NOTHING;

INSERT INTO store_categories (id, store_id, name, name_ar, display_order, is_active) VALUES
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'Main Collection', 'المجموعة الرئيسية', 1, true),
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e12', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'Computers', 'كمبيوتر', 1, true),
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e13', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'Furniture', 'أثاث', 1, true)
ON CONFLICT DO NOTHING;

INSERT INTO products (id, store_id, name, description, price, category, stock_quantity, is_active, created_at, updated_at, image_urls) VALUES
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'Striped T-Shirt', 'Cotton tee', 350.00, 'Main Collection', 40, true, NOW(), NOW(), ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80']),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'Gaming PC', 'High end', 45000.00, 'Computers', 5, true, NOW(), NOW(), ARRAY['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80']),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'Wooden Chair', 'Solid wood', 1200.00, 'Furniture', 20, true, NOW(), NOW(), ARRAY['https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80'])
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ==========================================
-- BATCH 3 (Copy 2 - Minya)
-- ==========================================

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
VALUES
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c21', '00000000-0000-0000-0000-000000000000', 'fashion_c2@store.com', crypt('password123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', NOW(), NOW()),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c22', '00000000-0000-0000-0000-000000000000', 'tech_c2@store.com', crypt('password123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, full_name, role, governorate) VALUES
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c21', 'fashion_c2@store.com', 'Town Team Owner', 'merchant', 'Minya'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c22', 'tech_c2@store.com', 'Mobile Shop Owner', 'merchant', 'Minya')
ON CONFLICT (id) DO UPDATE SET role = 'merchant', governorate = 'Minya';

INSERT INTO stores (id, merchant_id, name, description, address, phone, category, governorate, subscription_plan, is_active, logo_url, banner_url) VALUES
('d2eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c21', 'Town Team', 'Casual wear', 'Station Square, Minya', '01000000021', 'Fashion', 'Minya', 'standard', true, 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80'),
('d2eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c22', 'Mobile Shop', 'All kinds of phones', 'El Horrya St, Minya', '01000000022', 'Electronics', 'Minya', 'standard', true, 'https://images.unsplash.com/photo-1598327105666-5b89351aff23?auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1556656793-02715d8dd6ae?auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, governorate = 'Minya';

INSERT INTO store_subcategories (store_id, subcategory_id) VALUES
('d2eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01'),
('d2eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11')
ON CONFLICT DO NOTHING;

INSERT INTO store_categories (id, store_id, name, name_ar, display_order, is_active) VALUES
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380e21', 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'Casual Wear', 'ملابس كاجوال', 1, true),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380e22', 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'Mobiles', 'موبايلات', 1, true)
ON CONFLICT DO NOTHING;

INSERT INTO products (id, store_id, name, description, price, category, stock_quantity, is_active, created_at, updated_at, image_urls) VALUES
('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380f21', 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'Slim Fit Jeans', 'Dark blue denim', 650.00, 'Casual Wear', 35, true, NOW(), NOW(), ARRAY['https://images.unsplash.com/photo-1542272617-08f083d03a6a?auto=format&fit=crop&q=80']),
('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'Samsung S24 Ultra', 'AI Phone', 48000.00, 'Mobiles', 8, true, NOW(), NOW(), ARRAY['https://images.unsplash.com/photo-1610945265078-d86f3d297dfb?auto=format&fit=crop&q=80'])
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
