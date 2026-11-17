import React, { createContext, useContext, useState, useCallback } from 'react';
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

interface CartContextType {
  cart: Cart;
  add: (item: CartItem) => void;
  updateQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  total: number;
  count: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(() => getCart());
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <CartContext.Provider
      value={{
        cart,
        add,
        updateQty,
        remove,
        clear,
        total: getCartTotal(cart),
        count: getCartCount(cart),
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used within CartProvider');
  return ctx;
}
