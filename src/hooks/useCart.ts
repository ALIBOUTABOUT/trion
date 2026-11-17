import { useState, useCallback } from 'react';
import {
  getCart,
  addToCart as addItem,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  getCartTotal,
  getCartCount,
} from '../lib/cart';
import type { Cart, CartItem } from '../types';

export function useCart() {
  const [cart, setCart] = useState<Cart>(() => getCart());

  const add = useCallback((item: CartItem) => {
    setCart(addItem(item));
  }, []);

  const updateQty = useCallback((variantId: string, qty: number) => {
    setCart(updateCartItemQuantity(variantId, qty));
  }, []);

  const remove = useCallback((variantId: string) => {
    setCart(removeFromCart(variantId));
  }, []);

  const clear = useCallback(() => {
    clearCart();
    setCart({ items: [] });
  }, []);

  return {
    cart,
    add,
    updateQty,
    remove,
    clear,
    total: getCartTotal(cart),
    count: getCartCount(cart),
  };
}
