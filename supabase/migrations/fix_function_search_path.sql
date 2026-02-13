-- Fix "Function Search Path Mutable" security warnings
-- Set explicit search_path on all affected functions

ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_store_followers() SET search_path = public, pg_temp;
ALTER FUNCTION public.on_product_created() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_branch_products_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.on_product_price_drop() SET search_path = public, pg_temp;
ALTER FUNCTION public.validate_coupon(UUID, UUID, NUMERIC) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_commission_on_order_complete() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_store_rating() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_order_completion() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_orders_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_pickup_code() SET search_path = public, pg_temp;
ALTER FUNCTION public.check_stock_before_order() SET search_path = public, pg_temp;
ALTER FUNCTION public.deduct_stock_after_order() SET search_path = public, pg_temp;
ALTER FUNCTION public.manage_inventory_from_orders_table() SET search_path = public, pg_temp;
ALTER FUNCTION public.check_stock_before_order_item() SET search_path = public, pg_temp;
ALTER FUNCTION public.deduct_stock_after_order_item() SET search_path = public, pg_temp;
