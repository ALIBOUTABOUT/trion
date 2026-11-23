import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';

/**
 * Subscribes to Supabase Realtime INSERT events on the `orders` table.
 * Uses a unique channel identifier per instance and cleans up on unmount.
 *
 * IMPORTANT: Enable Realtime replication for the `orders` table in Supabase Dashboard:
 *   Database → Replication → toggle on `orders`
 */
export function useRealtimeOrders(onNewOrder: (order: Partial<Order>) => void) {
  const callbackRef = useRef(onNewOrder);
  useEffect(() => {
    callbackRef.current = onNewOrder;
  }, [onNewOrder]);

  useEffect(() => {
    const channelId = `admin-orders-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload?.new) {
            callbackRef.current(payload.new as Partial<Order>);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Subscribed to orders INSERT events');
        }
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Realtime] orders channel error:', err?.message || 'Check Realtime replication in Supabase Dashboard');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
