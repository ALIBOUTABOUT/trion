import { supabase, isSupabaseConfigured } from './supabase';
import { MOCK_PRODUCTS, MOCK_SETTINGS } from './mock-data';
import type { Product, Order, StoreSettings, CheckoutFormData, CartItem, DashboardStats } from '../types';

// ============================================================
// Products
// ============================================================
export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return MOCK_PRODUCTS;
  const { data, error } = await supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .eq('is_available', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Product[];
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
  }
  const { data, error } = await supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Product;
}

// ============================================================
// Settings
// ============================================================
export async function getStoreSettings(): Promise<StoreSettings[]> {
  if (!isSupabaseConfigured()) return MOCK_SETTINGS;
  const { data, error } = await supabase.from('store_settings').select('*');
  if (error) throw error;
  return data as StoreSettings[];
}

export function getSettingValue(settings: StoreSettings[], key: string, defaultValue = ''): string {
  return settings.find((s) => s.key === key)?.value ?? defaultValue;
}

// ============================================================
// Orders — Direct Supabase Insert (no Edge Function required)
// ============================================================

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TWO-${timestamp}-${random}`;
}

export async function submitOrder(params: {
  customer: CheckoutFormData;
  items: CartItem[];
  deliveryFee: number;
}): Promise<{ success: boolean; order_number: string; order_id: string }> {
  if (!isSupabaseConfigured()) {
    await new Promise((r) => setTimeout(r, 1200));
    return { success: true, order_number: 'TWO-DEMO-001', order_id: 'mock-order-id' };
  }

  const { customer, items, deliveryFee } = params;

  // ── Step 1: Fetch trusted prices & validate stock from DB ────────────────
  const variantIds = items.map((i) => i.variant_id);
  const { data: variants, error: varError } = await supabase
    .from('product_variants')
    .select('id, stock, price_adjustment, products(id, name, base_price, is_available)')
    .in('id', variantIds);

  if (varError || !variants || variants.length === 0) {
    throw new Error('فشل التحقق من المنتجات — يرجى تحديث الصفحة والمحاولة مجدداً');
  }

  // Calculate trusted subtotal & validate stock
  let subtotal = 0;
  const validatedItems: Array<{
    variant_id: string;
    product_name: string;
    color: string;
    size: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    new_stock: number;
  }> = [];

  for (const cartItem of items) {
    const variant = variants.find((v: any) => v.id === cartItem.variant_id) as any;
    if (!variant) throw new Error(`المنتج المحدد غير متوفر في قاعدة البيانات`);

    const product = variant.products as any;
    if (!product?.is_available) {
      throw new Error(`المنتج "${product?.name || ''}" غير متاح للشراء حالياً`);
    }
    if (variant.stock < cartItem.quantity) {
      throw new Error(
        `الكمية المطلوبة من "${product.name}" غير متوفرة (المتبقي في المخزن: ${variant.stock})`
      );
    }

    const unitPrice = Number(product.base_price) + Number(variant.price_adjustment);
    const itemTotal = unitPrice * cartItem.quantity;
    subtotal += itemTotal;

    validatedItems.push({
      variant_id: variant.id,
      product_name: product.name,
      color: cartItem.color,
      size: cartItem.size,
      quantity: cartItem.quantity,
      unit_price: unitPrice,
      total_price: itemTotal,
      new_stock: variant.stock - cartItem.quantity,
    });
  }

  const total = subtotal + Number(deliveryFee);
  const orderNumber = generateOrderNumber();

  // Generate UUIDs client-side so we never need to SELECT back from
  // customers or orders (those tables have admin-only SELECT policies).
  const customerId = crypto.randomUUID();
  const orderId = crypto.randomUUID();

  // ── Step 2: Insert Customer ──────────────────────────────────────────────
  const { error: custError } = await supabase
    .from('customers')
    .insert({
      id: customerId,
      full_name: customer.full_name.trim(),
      phone: customer.phone.trim(),
      wilaya: customer.wilaya.trim(),
      commune: customer.commune.trim(),
      address: customer.address.trim(),
    });

  if (custError) {
    throw new Error(`فشل تسجيل بيانات العميل: ${custError.message}`);
  }

  // ── Step 3: Insert Order ─────────────────────────────────────────────────
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      order_number: orderNumber,
      customer_id: customerId,
      status: 'pending',
      subtotal,
      delivery_fee: Number(deliveryFee),
      total,
      payment_method: 'cod',
      notes: customer.notes?.trim() || null,
    });

  if (orderError) {
    throw new Error(`فشل إنشاء الطلب: ${orderError.message}`);
  }

  // ── Step 4: Insert Order Items ───────────────────────────────────────────
  const { error: itemsError } = await supabase.from('order_items').insert(
    validatedItems.map((vi) => ({
      order_id: orderId,
      variant_id: vi.variant_id,
      product_name: vi.product_name,
      color: vi.color,
      size: vi.size,
      quantity: vi.quantity,
      unit_price: vi.unit_price,
      total_price: vi.total_price,
    }))
  );

  if (itemsError) {
    throw new Error(`فشل حفظ تفاصيل الطلب: ${itemsError.message}`);
  }

  // ── Step 5: Deduct stock via SECURITY DEFINER function ──────────────────
  // The anon key cannot UPDATE product_variants directly (RLS: admin-only).
  // We call the `deduct_variant_stock` Postgres function which runs with
  // elevated privileges and also prevents stock from going below zero.
  for (const vi of validatedItems) {
    const { error: stockErr } = await supabase.rpc('deduct_variant_stock', {
      p_variant_id: vi.variant_id,
      p_quantity: vi.quantity,
    });
    if (stockErr) {
      console.warn('[stock deduction]', stockErr.message);
      // Non-fatal: order is already saved. Admin can correct manually.
    }
  }

  return { success: true, order_number: orderNumber, order_id: orderId };
}

// ============================================================
// Admin
// ============================================================
export async function getAdminDashboardStats(): Promise<DashboardStats> {
  if (!isSupabaseConfigured()) {
    return {
      total_orders: 42,
      pending_orders: 8,
      confirmed_orders: 15,
      delivered_orders: 19,
      total_sales: 182500,
      recent_orders: [],
    };
  }
  const [ordersRes, deliveredRes] = await Promise.all([
    supabase.from('orders').select('status, total, created_at, id, order_number, customer_id'),
    supabase.from('orders').select('total').eq('status', 'delivered'),
  ]);
  if (ordersRes.error) throw ordersRes.error;
  const orders = ordersRes.data as Order[];
  const totalSales = (deliveredRes.data ?? []).reduce((s, o) => s + (o.total as number), 0);
  return {
    total_orders: orders.length,
    pending_orders: orders.filter((o) => o.status === 'pending').length,
    confirmed_orders: orders.filter((o) => o.status === 'confirmed').length,
    delivered_orders: orders.filter((o) => o.status === 'delivered').length,
    total_sales: totalSales,
    recent_orders: orders.slice(0, 5) as Order[],
  };
}

export async function getAllOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*, customer:customers(*), items:order_items(*, variant:product_variants(*, product:products(*)))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Order[];
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw error;
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return MOCK_PRODUCTS;
  const { data, error } = await supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Product[];
}

export async function upsertProduct(product: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .upsert(product)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertVariant(variant: Partial<import('../types').ProductVariant>): Promise<import('../types').ProductVariant> {
  const { data, error } = await supabase
    .from('product_variants')
    .upsert(variant)
    .select()
    .single();
  if (error) throw error;
  return data as import('../types').ProductVariant;
}

export async function deleteVariant(id: string): Promise<void> {
  const { error } = await supabase.from('product_variants').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadProductImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const { error } = await supabase.storage.from('product-images').upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
  return data.publicUrl;
}
