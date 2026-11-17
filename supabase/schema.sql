-- ==============================================================================
-- TRION.WEAR.OFF — Production Database Schema & Security Architecture
-- Target: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Clean Drop (if re-running setup)
-- ==============================================================================
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS product_variants CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS store_settings CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ==============================================================================
-- 3. Profiles Table (Admin Authorization linked to Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile entry on auth.users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    -- First created user can be auto-promoted to admin if desired, or set default 'user'
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. Products Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
  images TEXT[] NOT NULL DEFAULT '{}',
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);

-- ==============================================================================
-- 5. Product Variants Table (Sizes, Colors, Individual Stock)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color TEXT NOT NULL,
  color_hex TEXT NOT NULL DEFAULT '#1A1A1A',
  size TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  price_adjustment NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_color_size UNIQUE(product_id, color, size)
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_stock ON product_variants(stock);

-- ==============================================================================
-- 6. Customers Table (No accounts needed for public buyers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  commune TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC);

-- ==============================================================================
-- 7. Orders Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
  ),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee NUMERIC(10, 2) NOT NULL CHECK (delivery_fee >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method = 'cod'),
  notes TEXT,
  whatsapp_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- ==============================================================================
-- 8. Order Items Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);

-- ==============================================================================
-- 9. Store Settings Table (Configurable fees, WhatsApp number, etc.)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. Stock Restoration on Order Cancellation Trigger
-- ==============================================================================
-- Avoid restoring stock more than once if status toggles between cancelled repeatedly
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

  -- If order was moved back OUT of 'cancelled' (un-cancelled): deduct stock safely
  IF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
    UPDATE public.product_variants pv
    SET stock = GREATEST(0, pv.stock - oi.quantity)
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND pv.id = oi.variant_id;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_order_cancellation ON orders;
CREATE TRIGGER trigger_order_cancellation
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_status_change();

-- ==============================================================================
-- 11. Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. Profiles RLS:
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- B. Products & Variants RLS:
-- ------------------------------------------------------------------------------
-- Public can read all active products
CREATE POLICY "Public can view available products"
  ON products FOR SELECT
  USING (is_available = TRUE OR public.is_admin());

-- Admins can create, edit, delete products
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (public.is_admin());

-- Public can view variants of available products
CREATE POLICY "Public can view product variants"
  ON product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
      AND (p.is_available = TRUE OR public.is_admin())
    )
  );

-- Admins can manage variants & stock
CREATE POLICY "Admins can manage product variants"
  ON product_variants FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- C. Customers RLS:
-- ------------------------------------------------------------------------------
-- Public checkout can create customers
CREATE POLICY "Public can insert customer on checkout"
  ON customers FOR INSERT
  WITH CHECK (TRUE);

-- Only admins can read customer information
CREATE POLICY "Only admins can view customers"
  ON customers FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Only admins can update customers"
  ON customers FOR UPDATE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- D. Orders & Order Items RLS:
-- ------------------------------------------------------------------------------
-- Public cannot freely read all orders (protecting privacy)
-- Edge Function runs with SERVICE_ROLE to insert orders safely.
-- Direct insert allowed for checkout flow:
CREATE POLICY "Public can insert orders"
  ON orders FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Public can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (TRUE);

-- Only authenticated administrators can read/update orders
CREATE POLICY "Only admins can view orders"
  ON orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Only admins can update orders"
  ON orders FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Only admins can view order items"
  ON order_items FOR SELECT
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- E. Store Settings RLS:
-- ------------------------------------------------------------------------------
-- Public can read store settings (delivery fees, phone, etc.)
CREATE POLICY "Public can view store settings"
  ON store_settings FOR SELECT
  USING (TRUE);

-- Only admins can modify store settings
CREATE POLICY "Only admins can update store settings"
  ON store_settings FOR ALL
  USING (public.is_admin());

-- ==============================================================================
-- 12. Storage Bucket Setup (Product Images)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Public can read images in bucket
CREATE POLICY "Public can read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Only authenticated admins can upload images
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- Only authenticated admins can delete images
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.is_admin());

-- ==============================================================================
-- 13. Initial Seed Data (TRION.WEAR.OFF Launch)
-- ==============================================================================

-- Store Settings
INSERT INTO store_settings (key, value, description)
VALUES 
  ('delivery_fee', '500', 'رسوم التوصيل الوطنية بالدينار الجزائري لجميع الـ 58 ولاية'),
  ('whatsapp_recipient_number', '+213XXXXXXXXX', 'رقم هاتف متجر TRION الذي يستقبل إشعارات الطلبات'),
  ('store_phone', '+213XXXXXXXXX', 'رقم هاتف خدمة الزبائن المعروض في الموقع'),
  ('instagram_url', 'https://instagram.com/trionwearoff', 'رابط حساب الإنستغرام الرسمي لـ TRION')
ON CONFLICT (key) DO NOTHING;

-- Product 1: Classic Hoodie
WITH p1 AS (
  INSERT INTO products (id, name, description, base_price, images, is_available)
  VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'هودي TRION كلاسيك',
    'هودي فاخر بتصميم مينيماليست من علامة TRION.WEAR.OFF. مصنوع من قطن عالي الجودة بنسبة 100%، يمنحك دفئاً وأناقة لا تضاهى مع قصة عصرية مريحة.',
    3500.00,
    ARRAY[
      'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80'
    ],
    TRUE
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
INSERT INTO product_variants (product_id, color, color_hex, size, stock, price_adjustment)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'أسود', '#0A0A0A', 'S', 8, 0),
  ('a1000000-0000-0000-0000-000000000001', 'أسود', '#0A0A0A', 'M', 12, 0),
  ('a1000000-0000-0000-0000-000000000001', 'أسود', '#0A0A0A', 'L', 10, 0),
  ('a1000000-0000-0000-0000-000000000001', 'أسود', '#0A0A0A', 'XL', 5, 0),
  ('a1000000-0000-0000-0000-000000000001', 'أبيض', '#F5F5F5', 'S', 6, 0),
  ('a1000000-0000-0000-0000-000000000001', 'أبيض', '#F5F5F5', 'M', 9, 0),
  ('a1000000-0000-0000-0000-000000000001', 'أبيض', '#F5F5F5', 'L', 4, 0)
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Product 2: Oversized T-Shirt
WITH p2 AS (
  INSERT INTO products (id, name, description, base_price, images, is_available)
  VALUES (
    'a2000000-0000-0000-0000-000000000002',
    'تيشيرت TRION أوفرسايز',
    'تيشيرت أوفرسايز عصري من TRION.WEAR.OFF، بقصّة فضفاضة تناسب ستايل الستريت وير الفاخر. قماش قطني ممتاز مريح طوال اليوم.',
    1800.00,
    ARRAY[
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80'
    ],
    TRUE
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
INSERT INTO product_variants (product_id, color, color_hex, size, stock, price_adjustment)
VALUES
  ('a2000000-0000-0000-0000-000000000002', 'أسود', '#0A0A0A', 'S', 15, 0),
  ('a2000000-0000-0000-0000-000000000002', 'أسود', '#0A0A0A', 'M', 20, 0),
  ('a2000000-0000-0000-0000-000000000002', 'أسود', '#0A0A0A', 'L', 14, 0),
  ('a2000000-0000-0000-0000-000000000002', 'أسود', '#0A0A0A', 'XL', 8, 0),
  ('a2000000-0000-0000-0000-000000000002', 'رمادي داكن', '#374151', 'S', 10, 0),
  ('a2000000-0000-0000-0000-000000000002', 'رمادي داكن', '#374151', 'M', 12, 0),
  ('a2000000-0000-0000-0000-000000000002', 'رمادي داكن', '#374151', 'L', 7, 0)
ON CONFLICT (product_id, color, size) DO NOTHING;
