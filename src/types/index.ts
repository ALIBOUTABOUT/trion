// ============================================================
// TRION.WEAR.OFF — Core TypeScript Types
// ============================================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  images: string[];
  is_available: boolean;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  color: string;
  color_hex: string;
  size: string;
  stock: number;
  price_adjustment: number;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  variant_id: string;
  product_name: string;
  product_image: string;
  color: string;
  color_hex: string;
  size: string;
  quantity: number;
  unit_price: number;
}

export interface Cart {
  items: CartItem[];
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: 'cod';
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  product_name: string;
  color: string;
  size: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variant?: ProductVariant & { product?: Product };
}

export interface StoreSettings {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface CheckoutFormData {
  full_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  notes?: string;
}

export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
  total_sales: number;
  recent_orders: Order[];
}
