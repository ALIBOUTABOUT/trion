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
// Orders
// ============================================================
export async function submitOrder(params: {
  customer: CheckoutFormData;
  items: CartItem[];
  deliveryFee: number;
}): Promise<{ success: boolean; order_number: string; order_id: string }> {
  if (!isSupabaseConfigured()) {
    // Mock success for development
    await new Promise((r) => setTimeout(r, 1200));
    return { success: true, order_number: 'TWO-DEMO-001', order_id: 'mock-order-id' };
  }

  const { data, error } = await supabase.functions.invoke('submit-order', {
    body: params,
  });
  if (error) throw new Error(error.message || 'فشل في إرسال الطلب');
  return data as { success: boolean; order_number: string; order_id: string };
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
