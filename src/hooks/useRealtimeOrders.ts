import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';

/**
 * Subscribes to Supabase Realtime INSERT events on the `orders` table.
 * The authenticated admin session is used automatically, so RLS is respected.
 *
 * IMPORTANT: Enable Realtime replication for the `orders` table in Supabase Dashboard:
 *   Database → Replication → Source → toggle on `orders`
 */
export function useRealtimeOrders(onNewOrder: (order: Partial<Order>) => void) {
  // Keep a stable ref to the callback to avoid re-subscribing on every render
  const callbackRef = useRef(onNewOrder);
  useEffect(() => {
    callbackRef.current = onNewOrder;
  }, [onNewOrder]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          callbackRef.current(payload.new as Partial<Order>);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Subscribed to orders INSERT events');
        }
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Realtime] orders channel error — check Realtime replication is enabled in Supabase Dashboard');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // only once per mount
}
