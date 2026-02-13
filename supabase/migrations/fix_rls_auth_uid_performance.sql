-- Fix "Auth RLS Initialization Plan" warnings
-- Wrap auth.uid() in (select auth.uid()) so it's evaluated once per query, not per row

-- =====================
-- cart_items (4 policies)
-- =====================
ALTER POLICY "Users can view their own cart items" ON cart_items
  USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can insert their own cart items" ON cart_items
  WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "Users can update their own cart items" ON cart_items
  USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can delete their own cart items" ON cart_items
  USING ((select auth.uid()) = user_id);

-- =====================
-- wishlist_stores (3 policies)
-- =====================
ALTER POLICY "Users can view their own wishlist stores" ON wishlist_stores
  USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can insert their own wishlist stores" ON wishlist_stores
  WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "Users can delete their own wishlist stores" ON wishlist_stores
  USING ((select auth.uid()) = user_id);

-- =====================
-- coupons (1 policy)
-- =====================
ALTER POLICY "Merchants can manage their store coupons" ON coupons
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = coupons.store_id AND stores.merchant_id = (select auth.uid())));

-- =====================
-- commissions (1 policy)
-- =====================
ALTER POLICY "Merchants can view their store commissions" ON commissions
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = commissions.store_id AND stores.merchant_id = (select auth.uid())));

-- =====================
-- store_branches: skipped - policies will be created with (select auth.uid()) directly
-- via create_store_branches_table.sql when run
-- =====================

-- =====================
-- store_follows (2 policies)
-- =====================
ALTER POLICY "Users can follow stores" ON store_follows
  WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "Users can unfollow stores" ON store_follows
  USING ((select auth.uid()) = user_id);

-- =====================
-- orders (5 policies)
-- =====================
ALTER POLICY "Customers can view their own orders" ON orders
  USING ((select auth.uid()) = customer_id);

ALTER POLICY "Customers can insert their own orders" ON orders
  WITH CHECK ((select auth.uid()) = customer_id);

ALTER POLICY "Customers can update their own pending orders" ON orders
  USING ((select auth.uid()) = customer_id AND status IN ('reserved', 'confirmed'));

ALTER POLICY "Merchants can view their store orders" ON orders
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.merchant_id = (select auth.uid())));

ALTER POLICY "Merchants can update their store orders" ON orders
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.merchant_id = (select auth.uid())));

-- =====================
-- store_reviews (3 policies)
-- =====================
ALTER POLICY "Customers can create reviews for their orders" ON store_reviews
  WITH CHECK (
    (select auth.uid()) = customer_id
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
        AND orders.customer_id = (select auth.uid())
        AND orders.status = 'completed'
    )
  );

ALTER POLICY "Customers can update their own reviews" ON store_reviews
  USING ((select auth.uid()) = customer_id)
  WITH CHECK ((select auth.uid()) = customer_id);

ALTER POLICY "Merchants can reply to their store reviews" ON store_reviews
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_reviews.store_id AND stores.merchant_id = (select auth.uid())));

-- =====================
-- notifications (2 policies)
-- =====================
ALTER POLICY "Users can view their own notifications" ON notifications
  USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can update their own notifications" ON notifications
  USING ((select auth.uid()) = user_id);

-- =====================
-- store_categories (4 policies)
-- =====================
ALTER POLICY "Merchants can view all their store categories" ON store_categories
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_categories.store_id AND stores.merchant_id = (select auth.uid())));

ALTER POLICY "Merchants can create store categories" ON store_categories
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.merchant_id = (select auth.uid())));

ALTER POLICY "Merchants can update their store categories" ON store_categories
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_categories.store_id AND stores.merchant_id = (select auth.uid())));

ALTER POLICY "Merchants can delete their store categories" ON store_categories
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_categories.store_id AND stores.merchant_id = (select auth.uid())));
