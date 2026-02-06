-- Complete Store and Product Data Schema
-- Run this after creating at least one user account

DO $$
DECLARE
  user_id UUID;
  store1_id UUID;
  store2_id UUID;
  store3_id UUID;
  store4_id UUID;
  store5_id UUID;
  store6_id UUID;
  store7_id UUID;
  store8_id UUID;
BEGIN
  -- Get first user (or create a dummy merchant if needed)
  SELECT id INTO user_id FROM users LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'No users found! Please create a user account first.';
  END IF;

  RAISE NOTICE 'Using user_id: % for all stores', user_id;

  -- Insert 8 Featured Stores
  INSERT INTO stores (merchant_id, name, description, logo_url, address, maps_link, category, subscription_plan, is_active, points_balance)
  VALUES
    -- Store 1: Fashion Hub
    (user_id, 'Fashion Hub', 'Your destination for trendy clothing and accessories. Latest fashion trends from international brands.', 
     'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop', 
     'Cairo, Egypt - Downtown', 'https://maps.google.com', 'Clothing', 'premium', true, 1000),
    
    -- Store 2: Footwear Emporium
    (user_id, 'Footwear Emporium', 'Premium shoes and sneakers collection. From casual to formal, we have it all.', 
     'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300&h=300&fit=crop', 
     'Alexandria, Egypt - City Center', 'https://maps.google.com', 'Shoes', 'premium', true, 850),
    
    -- Store 3: Accessory Haven
    (user_id, 'Accessory Haven', 'Elegant accessories for every occasion. Jewelry, watches, bags and more.', 
     'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=300&h=300&fit=crop', 
     'Giza, Egypt - Mall of Arabia', 'https://maps.google.com', 'Accessories', 'basic', true, 650),
    
    -- Store 4: Style Studio
    (user_id, 'Style Studio', 'Complete fashion solutions under one roof. Personal styling services available.', 
     'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=300&h=300&fit=crop', 
     'Cairo, Egypt - Nasr City', 'https://maps.google.com', 'Clothing', 'premium', true, 920),
    
    -- Store 5: Urban Threads
    (user_id, 'Urban Threads', 'Street fashion and urban wear. Express yourself with bold designs.', 
     'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&h=300&fit=crop', 
     'Cairo, Egypt - Heliopolis', 'https://maps.google.com', 'Clothing', 'basic', true, 450),
    
    -- Store 6: Luxury Watches
    (user_id, 'Luxury Watches', 'Premium timepieces from world-renowned brands. Authorized dealer.', 
     'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop', 
     'Cairo, Egypt - Zamalek', 'https://maps.google.com', 'Watches', 'premium', true, 1200),
    
    -- Store 7: Bag Boutique
    (user_id, 'Bag Boutique', 'Designer bags and leather goods. Quality craftsmanship guaranteed.', 
     'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop', 
     'Giza, Egypt - 6th October', 'https://maps.google.com', 'Bags', 'basic', true, 380),
    
    -- Store 8: Gem Palace
    (user_id, 'Gem Palace', 'Fine jewelry and precious stones. Custom designs available.', 
     'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop', 
     'Cairo, Egypt - Maadi', 'https://maps.google.com', 'Jewelry', 'premium', true, 780)
  ON CONFLICT (id) DO NOTHING;

  -- Get all store IDs (one at a time to avoid multiple rows error)
  SELECT id INTO STRICT store1_id FROM stores WHERE name = 'Fashion Hub' AND merchant_id = user_id LIMIT 1;
  SELECT id INTO STRICT store2_id FROM stores WHERE name = 'Footwear Emporium' AND merchant_id = user_id LIMIT 1;
  SELECT id INTO STRICT store3_id FROM stores WHERE name = 'Accessory Haven' AND merchant_id = user_id LIMIT 1;
  SELECT id INTO STRICT store4_id FROM stores WHERE name = 'Style Studio' AND merchant_id = user_id LIMIT 1;
  SELECT id INTO STRICT store5_id FROM stores WHERE name = 'Urban Threads' AND merchant_id = user_id LIMIT 1;
  SELECT id INTO STRICT store6_id FROM stores WHERE name = 'Luxury Watches' AND merchant_id = user_id LIMIT 1;
  SELECT id INTO STRICT store7_id FROM stores WHERE name = 'Bag Boutique' AND merchant_id = user_id LIMIT 1;
  SELECT id INTO STRICT store8_id FROM stores WHERE name = 'Gem Palace' AND merchant_id = user_id LIMIT 1;

  -- Insert Products for Store 1: Fashion Hub (Clothing)
  -- Adding products with different timestamps to show in new arrivals
  INSERT INTO products (store_id, name, description, price, category, gender_filter, image_urls, stock_quantity, is_active, created_at) VALUES
  (store1_id, 'Summer Floral Dress', 'Light and breezy summer dress with floral pattern', 499.99, 'Clothing', 'Women', ARRAY['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&h=700&fit=crop'], 25, true, NOW() - INTERVAL '1 day'),
  (store1_id, 'Casual Linen Shirt', 'Breathable linen shirt perfect for summer', 379.99, 'Clothing', 'Men', ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=700&fit=crop'], 30, true, NOW() - INTERVAL '3 hours'),
  (store1_id, 'Denim Jacket', 'Classic denim jacket with modern fit', 549.99, 'Clothing', 'Unisex', ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=700&fit=crop'], 22, true, NOW() - INTERVAL '2 days'),
  (store1_id, 'Elegant Evening Gown', 'Sophisticated evening gown for special occasions', 1299.99, 'Clothing', 'Women', ARRAY['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500&h=700&fit=crop'], 10, true, NOW() - INTERVAL '5 hours');

  -- Insert Products for Store 2: Footwear Emporium (Shoes)
  INSERT INTO products (store_id, name, description, price, category, gender_filter, image_urls, stock_quantity, is_active, created_at) VALUES
  (store2_id, 'Classic Leather Sandals', 'Comfortable leather sandals for everyday wear', 349.99, 'Shoes', 'Women', ARRAY['https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=500&h=700&fit=crop'], 40, true, NOW() - INTERVAL '1 hour'),
  (store2_id, 'Premium Running Shoes', 'High-performance running shoes with cushioning', 899.99, 'Shoes', 'Unisex', ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=700&fit=crop'], 20, true, NOW() - INTERVAL '30 minutes'),
  (store2_id, 'Formal Oxford Shoes', 'Classic oxford shoes for business and formal events', 799.99, 'Shoes', 'Men', ARRAY['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500&h=700&fit=crop'], 15, true, NOW() - INTERVAL '4 days'),
  (store2_id, 'Casual Sneakers', 'Comfortable sneakers for daily wear', 449.99, 'Shoes', 'Unisex', ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&h=700&fit=crop'], 35, true, NOW() - INTERVAL '6 hours');

  -- Insert Products for Store 3: Accessory Haven
  INSERT INTO products (store_id, name, description, price, category, gender_filter, image_urls, stock_quantity, is_active, created_at) VALUES
  (store3_id, 'Statement Gold Necklace', 'Elegant gold-plated statement necklace', 299.99, 'Jewelry', 'Unisex', ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=700&fit=crop'], 15, true, NOW() - INTERVAL '2 hours'),
  (store3_id, 'Leather Belt', 'Premium leather belt with silver buckle', 199.99, 'Accessories', 'Unisex', ARRAY['https://images.unsplash.com/photo-1624222247344-550fb60583b2?w=500&h=700&fit=crop'], 25, true, NOW() - INTERVAL '3 days'),
  (store3_id, 'Silk Scarf', 'Luxurious silk scarf with elegant pattern', 249.99, 'Accessories', 'Women', ARRAY['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500&h=700&fit=crop'], 18, true, NOW() - INTERVAL '8 hours');

  -- Insert Products for Store 4: Style Studio
  INSERT INTO products (store_id, name, description, price, category, gender_filter, image_urls, stock_quantity, is_active, created_at) VALUES
  (store4_id, 'Business Suit', 'Professional business suit with modern cut', 1499.99, 'Clothing', 'Men', ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=700&fit=crop'], 12, true, NOW() - INTERVAL '15 minutes'),
  (store4_id, 'Cocktail Dress', 'Stylish cocktail dress for evening events', 899.99, 'Clothing', 'Women', ARRAY['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500&h=700&fit=crop'], 14, true, NOW() - INTERVAL '45 minutes');

  -- Insert Products for Store 5: Urban Threads
  INSERT INTO products (store_id, name, description, price, category, gender_filter, image_urls, stock_quantity, is_active, created_at) VALUES
  (store5_id, 'Graphic T-Shirt', 'Bold graphic t-shirt with street art design', 199.99, 'Clothing', 'Unisex', ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=700&fit=crop'], 50, true, NOW() - INTERVAL '10 minutes'),
  (store5_id, 'Cargo Pants', 'Comfortable cargo pants with multiple pockets', 449.99, 'Clothing', 'Unisex', ARRAY['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&h=700&fit=crop'], 30, true, NOW() - INTERVAL '5 days');

  -- Insert Products for Store 6: Luxury Watches
  INSERT INTO products (store_id, name, description, price, category, gender_filter, image_urls, stock_quantity, is_active, created_at) VALUES
  (store6_id, 'Minimalist Watch', 'Elegant minimalist watch with leather strap', 799.99, 'Watches', 'Unisex', ARRAY['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&h=700&fit=crop'], 12, true, NOW() - INTERVAL '20 minutes'),
  (store6_id, 'Chronograph Watch', 'Sophisticated chronograph with multiple functions', 1599.99, 'Watches', 'Men', ARRAY['https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500&h=700&fit=crop'], 8, true, NOW() - INTERVAL '7 hours'),
  (store6_id, 'Diamond Watch', 'Luxury watch with diamond accents', 2999.99, 'Watches', 'Women', ARRAY['https://images.unsplash.com/photo-1611652022419-a9419f74343a?w=500&h=700&fit=crop'], 5, true, NOW() - INTERVAL '6 days');

  -- Insert Products for Store 7: Bag Boutique
  INSERT INTO products (store_id, name, description, price, category, gender_filter, image_urls, stock_quantity, is_active, created_at) VALUES
  (store7_id, 'Designer Backpack', 'Stylish and functional designer backpack', 649.99, 'Bags', 'Unisex', ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=700&fit=crop'], 18, true, NOW() - INTERVAL '25 minutes'),
  (store7_id, 'Leather Handbag', 'Premium leather handbag with gold hardware', 899.99, 'Bags', 'Women', ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=700&fit=crop'], 15, true, NOW() - INTERVAL '4 hours'),
  (store7_id, 'Travel Duffel Bag', 'Spacious duffel bag perfect for travel', 549.99, 'Bags', 'Unisex', ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=700&fit=crop'], 20, true, NOW() - INTERVAL '7 days');

  -- Insert Products for Store 8: Gem Palace
  INSERT INTO products (store_id, name, description, price, category, gender_filter, image_urls, stock_quantity, is_active, created_at) VALUES
  (store8_id, 'Diamond Ring', 'Exquisite diamond ring with platinum setting', 3999.99, 'Jewelry', 'Women', ARRAY['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&h=700&fit=crop'], 6, true, NOW() - INTERVAL '5 minutes'),
  (store8_id, 'Gold Bracelet', 'Elegant 18k gold bracelet', 1299.99, 'Jewelry', 'Women', ARRAY['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&h=700&fit=crop'], 10, true, NOW() - INTERVAL '35 minutes'),
  (store8_id, 'Pearl Earrings', 'Classic pearl earrings with gold studs', 599.99, 'Jewelry', 'Women', ARRAY['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=700&fit=crop'], 12, true, NOW() - INTERVAL '9 hours');

  RAISE NOTICE '=================================';
  RAISE NOTICE 'Store and product data inserted successfully!';
  RAISE NOTICE 'Total Stores: %', (SELECT COUNT(*) FROM stores WHERE merchant_id = user_id);
  RAISE NOTICE 'Total Products: %', (SELECT COUNT(*) FROM products WHERE store_id IN (store1_id, store2_id, store3_id, store4_id, store5_id, store6_id, store7_id, store8_id));
  RAISE NOTICE '=================================';
END $$;
