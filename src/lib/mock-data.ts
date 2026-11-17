import type { Product, Order, StoreSettings } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'هودي TRION كلاسيك',
    description: 'هودي مريح وعصري من TRION.WEAR.OFF، مصنوع من قماش عالي الجودة. مثالي للاستخدام اليومي مع تصميم بسيط وأنيق يناسب جميع الأذواق.',
    base_price: 3500,
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
    ],
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variants: [
      { id: 'v-001-black-s', product_id: 'prod-001', color: 'أسود', color_hex: '#1a1a1a', size: 'S', stock: 5, price_adjustment: 0, created_at: new Date().toISOString() },
      { id: 'v-001-black-m', product_id: 'prod-001', color: 'أسود', color_hex: '#1a1a1a', size: 'M', stock: 8, price_adjustment: 0, created_at: new Date().toISOString() },
      { id: 'v-001-black-l', product_id: 'prod-001', color: 'أسود', color_hex: '#1a1a1a', size: 'L', stock: 6, price_adjustment: 0, created_at: new Date().toISOString() },
      { id: 'v-001-black-xl', product_id: 'prod-001', color: 'أسود', color_hex: '#1a1a1a', size: 'XL', stock: 3, price_adjustment: 0, created_at: new Date().toISOString() },
      { id: 'v-001-white-s', product_id: 'prod-001', color: 'أبيض', color_hex: '#f5f5f5', size: 'S', stock: 4, price_adjustment: 0, created_at: new Date().toISOString() },
      { id: 'v-001-white-m', product_id: 'prod-001', color: 'أبيض', color_hex: '#f5f5f5', size: 'M', stock: 7, price_adjustment: 0, created_at: new Date().toISOString() },
      { id: 'v-001-white-l', product_id: 'prod-001', color: 'أبيض', color_hex: '#f5f5f5', size: 'L', stock: 0, price_adjustment: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: 'prod-002',
    name: 'تيشيرت TRION أوفرسايز',
    description: 'تيشيرت أوفرسايز بتصميم أصيل من TRION.WEAR.OFF. قماش قطني ناعم وأسلوب عصري يجعلك مميزاً في أي مكان.',
    base_price: 1800,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80',
    ],
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variants: [
      { id: 'v-002-black-s', product_id: 'prod-002', color: 'أسود', color_hex: '#1a1a1a', size: 'S', stock: 10, price_adjustment: 0, created_at: new Date().toISOString() },
      { id: 'v-002-black-m', product_id: 'prod-002', color: 'أسود', color_hex: '#1a1a1a', size: 'M', stock: 12, price_adjustment: 0, created_at: new Date().toISOString() },
      { id: 'v-002-black-l', product_id: 'prod-002', color: 'أسود', color_hex: '#1a1a1a', size: 'L', stock: 9, price_adjustment: 0, created_at: new Date().toISOString() },
      { id: 'v-002-black-xl', product_id: 'prod-002', color: 'أسود', color_hex: '#1a1a1a', size: 'XL', stock: 5, price_adjustment: 0, created_at: new Date().toISOString() },
      { id: 'v-002-gray-s', product_id: 'prod-002', color: 'رمادي', color_hex: '#6b7280', size: 'S', stock: 6, price_adjustment: 0, created_at: new Date().toISOString() },
      { id: 'v-002-gray-m', product_id: 'prod-002', color: 'رمادي', color_hex: '#6b7280', size: 'M', stock: 8, price_adjustment: 0, created_at: new Date().toISOString() },
      { id: 'v-002-gray-l', product_id: 'prod-002', color: 'رمادي', color_hex: '#6b7280', size: 'L', stock: 4, price_adjustment: 0, created_at: new Date().toISOString() },
    ],
  },
];

export const MOCK_SETTINGS: StoreSettings[] = [
  { id: '1', key: 'delivery_fee', value: '500', updated_at: new Date().toISOString() },
  { id: '2', key: 'whatsapp_number', value: '+213XXXXXXXXX', updated_at: new Date().toISOString() },
  { id: '3', key: 'instagram_url', value: 'https://instagram.com/trionwearoff', updated_at: new Date().toISOString() },
  { id: '4', key: 'store_phone', value: '+213XXXXXXXXX', updated_at: new Date().toISOString() },
];

export const MOCK_RECENT_ORDERS: Order[] = [
  {
    id: 'ord-001',
    order_number: 'TWO-2024-001',
    customer_id: 'cust-001',
    status: 'pending',
    subtotal: 3500,
    delivery_fee: 500,
    total: 4000,
    payment_method: 'cod',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customer: {
      id: 'cust-001',
      full_name: 'أحمد بن علي',
      phone: '0550123456',
      wilaya: 'الجزائر',
      commune: 'باب الزوار',
      address: 'شارع الاستقلال رقم 15',
      created_at: new Date().toISOString(),
    },
  },
];
