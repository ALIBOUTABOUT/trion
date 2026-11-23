-- ==============================================================================
-- TRION.WEAR.OFF — Complete Production Readiness SQL Migration
-- Target: PostgreSQL 15+ / Supabase
-- Execution: Supabase Dashboard → SQL Editor
-- Properties: 100% IDEMPOTENT (Safe to re-run), Non-destructive (Preserves existing data)
-- ==============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Store Settings Table & Default Configuration
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on store_settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Helper function: verify if the current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Policy: Public can read store settings (delivery fees, store phone, etc.)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'store_settings' AND policyname = 'Public can view store settings'
  ) THEN
    CREATE POLICY "Public can view store settings"
      ON public.store_settings FOR SELECT
      USING (TRUE);
  END IF;
END $$;

-- Policy: Only verified admins can update store settings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'store_settings' AND policyname = 'Admins can update store settings'
  ) THEN
    CREATE POLICY "Admins can update store settings"
      ON public.store_settings FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

-- Seed default settings without overwriting existing customized values
INSERT INTO public.store_settings (key, value, description)
VALUES 
  ('delivery_fee', '500', 'رسوم التوصيل الوطنية بالدينار الجزائري لجميع الـ 58 ولاية'),
  ('store_phone', '+213557919224', 'رقم هاتف متجر TRION وخدمة الزبائن'),
  ('whatsapp_recipient_number', '+213557919224', 'رقم الهاتف المعتمد لاستقبال ومتابعة الطلبيات'),
  ('instagram_url', 'https://instagram.com/trion.wear.off', 'رابط حساب الإنستغرام الرسمي لمتجر TRION')
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description;

-- ==============================================================================
-- 3. Order Cancellation & Stock Restoration Trigger
-- ==============================================================================
-- Guarantees inventory consistency:
-- - Restores stock exactly once when an order transitions to 'cancelled'
-- - Safely re-deducts stock if a cancelled order is moved back to an active status
-- - Ignores normal lifecycle transitions (pending -> confirmed -> shipped -> delivered)
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If order was changed TO 'cancelled' from another status: restore stock
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.product_variants pv
    SET stock = pv.stock + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND pv.id = oi.variant_id;
  END IF;

  -- If order was un-cancelled (moved back out of 'cancelled'): deduct stock safely
  IF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
    UPDATE public.product_variants pv
    SET stock = GREATEST(0, pv.stock - oi.quantity)
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND pv.id = oi.variant_id;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_order_cancellation ON public.orders;
CREATE TRIGGER trigger_order_cancellation
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_status_change();

-- ==============================================================================
-- 4. Legacy Stock Deduction Function (Preserved for compatibility)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.deduct_variant_stock(
  p_variant_id UUID,
  p_quantity    INTEGER
)
RETURNS VOID AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'الكمية المطلوبة يجب أن تكون أكبر من الصفر';
  END IF;

  UPDATE public.product_variants
  SET stock = stock - p_quantity
  WHERE id = p_variant_id
    AND stock >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الكمية المطلوبة غير متوفرة في المخزن للمتغير: %', p_variant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.deduct_variant_stock(UUID, INTEGER) TO anon, authenticated;

-- ==============================================================================
-- 5. Atomic Order Submission Function (Single Transaction, Concurrency Safe)
-- ==============================================================================
-- Performs complete order placement inside a single atomic PostgreSQL transaction:
--  1. Validates customer input fields (name, phone, wilaya, commune, address).
--  2. Checks that cart items array is not empty and quantities are positive integers.
--  3. Obtains exclusive row locks (FOR UPDATE) on product variants to prevent race conditions.
--  4. Verifies product availability and ensures variant has sufficient stock.
--  5. Calculates trusted unit prices from products.base_price + product_variants.price_adjustment.
--  6. Fetches trusted delivery fee from public.store_settings (ignoring any client value).
--  7. Deducts variant stock atomically.
--  8. Inserts customer record and generates unique order number.
--  9. Inserts orders row and all order_items rows.
-- 10. Automatically rolls back completely if ANY error occurs.
CREATE OR REPLACE FUNCTION public.submit_order_atomic(
  p_customer JSONB,
  p_items    JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_full_name     TEXT;
  v_phone         TEXT;
  v_wilaya        TEXT;
  v_commune       TEXT;
  v_address       TEXT;
  v_notes         TEXT;
  
  v_customer_id   UUID;
  v_order_id      UUID;
  v_order_number  TEXT;
  
  v_delivery_fee  NUMERIC(10, 2) := 500.00;
  v_subtotal      NUMERIC(10, 2) := 0.00;
  v_total         NUMERIC(10, 2) := 0.00;
  
  v_item_elem     JSONB;
  v_variant_id    UUID;
  v_requested_qty INTEGER;
  
  v_variant_row   RECORD;
  v_unit_price    NUMERIC(10, 2);
  v_item_total    NUMERIC(10, 2);
BEGIN
  -- A. Validate Customer Parameters
  IF p_customer IS NULL THEN
    RAISE EXCEPTION 'بيانات العميل مطلوبة لإتمام الطلب';
  END IF;

  v_full_name := trim(COALESCE(p_customer->>'full_name', ''));
  v_phone     := trim(COALESCE(p_customer->>'phone', ''));
  v_wilaya    := trim(COALESCE(p_customer->>'wilaya', ''));
  v_commune   := trim(COALESCE(p_customer->>'commune', ''));
  v_address   := trim(COALESCE(p_customer->>'address', ''));
  v_notes     := NULLIF(trim(COALESCE(p_customer->>'notes', '')), '');

  IF length(v_full_name) < 2 THEN
    RAISE EXCEPTION 'يرجى إدخال الاسم واللقب بشكل صحيح';
  END IF;

  IF length(v_phone) < 9 THEN
    RAISE EXCEPTION 'يرجى إدخال رقم هاتف جزائري صالح للتواصل';
  END IF;

  IF length(v_wilaya) < 2 THEN
    RAISE EXCEPTION 'يرجى اختيار الولاية';
  END IF;

  IF length(v_commune) < 2 THEN
    RAISE EXCEPTION 'يرجى إدخال اسم البلدية';
  END IF;

  IF length(v_address) < 4 THEN
    RAISE EXCEPTION 'يرجى كتابة عنوان التوصيل بالتفصيل';
  END IF;

  -- B. Validate Cart Items
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'سلة التسوق فارغة، يرجى إضافة منتجات قبل الطلب';
  END IF;

  -- C. Fetch Trusted Delivery Fee from Store Settings
  BEGIN
    SELECT COALESCE(NULLIF(value, '')::NUMERIC, 500.00)
    INTO v_delivery_fee
    FROM public.store_settings
    WHERE key = 'delivery_fee';
  EXCEPTION WHEN OTHERS THEN
    v_delivery_fee := 500.00;
  END;

  IF v_delivery_fee IS NULL OR v_delivery_fee < 0 THEN
    v_delivery_fee := 500.00;
  END IF;

  -- D. Loop 1: Concurrency Lock, Availability & Stock Check, Price Calculation & Deduction
  FOR v_item_elem IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_variant_id := (v_item_elem->>'variant_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'معرف المنتج المطلوب غير صالح';
    END;

    v_requested_qty := (v_item_elem->>'quantity')::INTEGER;

    IF v_requested_qty IS NULL OR v_requested_qty <= 0 THEN
      RAISE EXCEPTION 'الكمية المطلوبة يجب أن تكون أكبر من الصفر';
    END IF;

    -- Pessimistic Lock (FOR UPDATE) guarantees no race condition / double-spending
    SELECT 
      pv.id,
      pv.stock,
      pv.color,
      pv.size,
      pv.price_adjustment,
      p.id AS product_id,
      p.name AS product_name,
      p.base_price,
      p.is_available
    INTO v_variant_row
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_variant_id
    FOR UPDATE OF pv;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'أحد المنتجات المحددة لم يعد متوفراً في المتجر';
    END IF;

    IF NOT v_variant_row.is_available THEN
      RAISE EXCEPTION 'المنتج "%" غير متاح للشراء في الوقت الحالي', v_variant_row.product_name;
    END IF;

    IF v_variant_row.stock < v_requested_qty THEN
      RAISE EXCEPTION 'الكمية المطلوبة من "%" غير متوفرة (الكمية المتبقية: %)', 
        v_variant_row.product_name, v_variant_row.stock;
    END IF;

    -- Trusted price calculation
    v_unit_price := GREATEST(0, v_variant_row.base_price + v_variant_row.price_adjustment);
    v_item_total := v_unit_price * v_requested_qty;
    v_subtotal := v_subtotal + v_item_total;

    -- Safely deduct inventory row
    UPDATE public.product_variants
    SET stock = stock - v_requested_qty
    WHERE id = v_variant_id;
  END LOOP;

  -- E. Grand Total
  v_total := v_subtotal + v_delivery_fee;

  -- F. Generate Unique Identifiers
  v_customer_id  := gen_random_uuid();
  v_order_id     := gen_random_uuid();
  -- Format: TWO-YYMMDD-HEX (e.g. TWO-261123-A4F1B9)
  v_order_number := 'TWO-' || to_char(NOW(), 'YYMMDD') || '-' || upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 6));

  -- G. Insert Customer Record
  INSERT INTO public.customers (
    id, full_name, phone, wilaya, commune, address
  ) VALUES (
    v_customer_id, v_full_name, v_phone, v_wilaya, v_commune, v_address
  );

  -- H. Insert Order Record
  INSERT INTO public.orders (
    id,
    order_number,
    customer_id,
    status,
    subtotal,
    delivery_fee,
    total,
    payment_method,
    notes
  ) VALUES (
    v_order_id,
    v_order_number,
    v_customer_id,
    'pending',
    v_subtotal,
    v_delivery_fee,
    v_total,
    'cod',
    v_notes
  );

  -- I. Insert Order Items Records
  FOR v_item_elem IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id    := (v_item_elem->>'variant_id')::UUID;
    v_requested_qty := (v_item_elem->>'quantity')::INTEGER;

    SELECT 
      pv.color,
      pv.size,
      pv.price_adjustment,
      p.name AS product_name,
      p.base_price
    INTO v_variant_row
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_variant_id;

    v_unit_price := GREATEST(0, v_variant_row.base_price + v_variant_row.price_adjustment);
    v_item_total := v_unit_price * v_requested_qty;

    INSERT INTO public.order_items (
      order_id,
      variant_id,
      product_name,
      color,
      size,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      v_order_id,
      v_variant_id,
      v_variant_row.product_name,
      v_variant_row.color,
      v_variant_row.size,
      v_requested_qty,
      v_unit_price,
      v_item_total
    );
  END LOOP;

  -- J. Return Success Payload to Frontend
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'delivery_fee', v_delivery_fee,
    'total', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Grant execution permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.submit_order_atomic(JSONB, JSONB) TO anon, authenticated;

-- ==============================================================================
-- 6. Ensure Existing Fallback RLS Policies Remain Intact
-- ==============================================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' AND policyname = 'Public can insert customer on checkout'
  ) THEN
    CREATE POLICY "Public can insert customer on checkout"
      ON public.customers FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Public can insert orders'
  ) THEN
    CREATE POLICY "Public can insert orders"
      ON public.orders FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_items' AND policyname = 'Public can insert order items'
  ) THEN
    CREATE POLICY "Public can insert order items"
      ON public.order_items FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;
