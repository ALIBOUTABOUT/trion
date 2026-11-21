// ==============================================================================
// TRION.WEAR.OFF — Supabase Edge Function: submit-order
// Runtime: Deno / Supabase Edge Functions
// ==============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SubmitOrderItem {
  variant_id: string;
  quantity: number;
}

interface SubmitOrderPayload {
  customer: {
    full_name: string;
    phone: string;
    wilaya: string;
    commune: string;
    address: string;
    notes?: string;
  };
  items: SubmitOrderItem[];
  deliveryFee: number;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TWO-${timestamp}-${random}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase environment variables are not configured in Edge Function');
    }

    // Service role client bypasses RLS for atomic server-side checkout processing
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body: SubmitOrderPayload = await req.json();
    const { customer, items, deliveryFee = 500 } = body;

    // 1. Basic validation
    if (!customer?.full_name || !customer?.phone || !customer?.wilaya || !customer?.commune || !customer?.address) {
      return new Response(JSON.stringify({ error: 'معلومات العميل غير مكتملة' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'سلة التسوق فارغة' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch variants & products from DB to get TRUSTED prices and verify stock
    const variantIds = items.map((i) => i.variant_id);
    const { data: variants, error: varError } = await supabase
      .from('product_variants')
      .select('id, product_id, color, size, stock, price_adjustment, products(id, name, base_price, is_available)')
      .in('id', variantIds);

    if (varError || !variants || variants.length === 0) {
      throw new Error('فشل التحقق من المنتجات المختارة في قاعدة البيانات');
    }

    // Map and validate stock & calculate trusted subtotal
    let subtotal = 0;
    const validatedItems = [];

    for (const requestedItem of items) {
      const variant = variants.find((v: any) => v.id === requestedItem.variant_id);
      if (!variant) {
        throw new Error(`المتغير ${requestedItem.variant_id} غير متوفر`);
      }

      const product = variant.products as any;
      if (!product || !product.is_available) {
        throw new Error(`المنتج ${product?.name || ''} غير متاح للشراء حالياً`);
      }

      if (variant.stock < requestedItem.quantity) {
        throw new Error(
          `الكمية المطلوبة من "${product.name} (${variant.color} - ${variant.size})" غير متوفرة حالياً (المتبقي: ${variant.stock})`
        );
      }

      const unitPrice = Number(product.base_price) + Number(variant.price_adjustment);
      const itemTotal = unitPrice * requestedItem.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        variant_id: variant.id,
        product_name: product.name,
        color: variant.color,
        size: variant.size,
        quantity: requestedItem.quantity,
        unit_price: unitPrice,
        total_price: itemTotal,
        new_stock: variant.stock - requestedItem.quantity,
      });
    }

    const total = subtotal + Number(deliveryFee);
    const orderNumber = generateOrderNumber();

    // 3. Insert Customer Record
    const { data: customerRecord, error: custError } = await supabase
      .from('customers')
      .insert({
        full_name: customer.full_name.trim(),
        phone: customer.phone.trim(),
        wilaya: customer.wilaya.trim(),
        commune: customer.commune.trim(),
        address: customer.address.trim(),
      })
      .select('id')
      .single();

    if (custError || !customerRecord) {
      throw new Error(`فشل تسجيل بيانات العميل: ${custError?.message}`);
    }

    // 4. Insert Order Record
    const { data: orderRecord, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerRecord.id,
        status: 'pending',
        subtotal,
        delivery_fee: Number(deliveryFee),
        total,
        payment_method: 'cod',
        notes: customer.notes || null,
        whatsapp_sent: false,
      })
      .select('id')
      .single();

    if (orderError || !orderRecord) {
      throw new Error(`فشل إنشاء الطلب: ${orderError?.message}`);
    }

    // 5. Insert Order Items
    const orderItemsToInsert = validatedItems.map((vi) => ({
      order_id: orderRecord.id,
      variant_id: vi.variant_id,
      product_name: vi.product_name,
      color: vi.color,
      size: vi.size,
      quantity: vi.quantity,
      unit_price: vi.unit_price,
      total_price: vi.total_price,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
    if (itemsError) {
      throw new Error(`فشل حفظ تفاصيل الطلب: ${itemsError.message}`);
    }

    // 6. Deduct Stock safely
    for (const vi of validatedItems) {
      await supabase
        .from('product_variants')
        .update({ stock: vi.new_stock })
        .eq('id', vi.variant_id);
    }

    // 7. Order saved. Realtime will push the new order to the Admin Dashboard automatically.
    // WhatsApp Cloud API notification has been removed — the Admin Dashboard is the primary
    // notification and order management system.

    return new Response(
      JSON.stringify({
        success: true,
        order_number: orderNumber,
        order_id: orderRecord.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[submit-order] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'حدث خطأ غير متوقع أثناء معالجة الطلب',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
