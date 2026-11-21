-- ==============================================================================
-- TRION.WEAR.OFF — Patch: Allow public order submission without Edge Function
-- Run this in Supabase Dashboard → SQL Editor
-- ==============================================================================

-- 1. Allow anon/public to UPDATE stock on product_variants (needed for checkout)
--    We use a SECURITY DEFINER function so the anon key can safely deduct stock
--    without having blanket UPDATE permission on the variants table.

CREATE OR REPLACE FUNCTION public.deduct_variant_stock(
  p_variant_id UUID,
  p_quantity    INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.product_variants
  SET stock = stock - p_quantity
  WHERE id = p_variant_id
    AND stock >= p_quantity;   -- prevents negative stock

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الكمية المطلوبة غير متوفرة في المخزن للمتغير: %', p_variant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to anonymous / authenticated users
GRANT EXECUTE ON FUNCTION public.deduct_variant_stock(UUID, INTEGER) TO anon, authenticated;


-- 2. Make sure INSERT policies exist (they should already from schema.sql, 
--    but this ensures they are present even if schema was partially applied)

-- customers: allow public insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' AND policyname = 'Public can insert customer on checkout'
  ) THEN
    CREATE POLICY "Public can insert customer on checkout"
      ON customers FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;

-- orders: allow public insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Public can insert orders'
  ) THEN
    CREATE POLICY "Public can insert orders"
      ON orders FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;

-- order_items: allow public insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_items' AND policyname = 'Public can insert order items'
  ) THEN
    CREATE POLICY "Public can insert order items"
      ON order_items FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;


-- 3. Verify everything is correct (run this SELECT to check)
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE tablename IN ('customers', 'orders', 'order_items', 'product_variants')
-- ORDER BY tablename, cmd;
