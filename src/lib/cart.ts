import type { Cart, CartItem } from '../types';

const CART_KEY = 'trion_cart';

export function getCart(): Cart {
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (!stored) return { items: [] };
    return JSON.parse(stored) as Cart;
  } catch {
    return { items: [] };
  }
}

export function saveCart(cart: Cart): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(item: CartItem): Cart {
  const cart = getCart();
  const existingIndex = cart.items.findIndex(
    (i) => i.variant_id === item.variant_id
  );
  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity += item.quantity;
  } else {
    cart.items.push(item);
  }
  saveCart(cart);
  return cart;
}

export function updateCartItemQuantity(variantId: string, quantity: number): Cart {
  const cart = getCart();
  if (quantity <= 0) {
    return removeFromCart(variantId);
  }
  const index = cart.items.findIndex((i) => i.variant_id === variantId);
  if (index >= 0) {
    cart.items[index].quantity = quantity;
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(variantId: string): Cart {
  const cart = getCart();
  cart.items = cart.items.filter((i) => i.variant_id !== variantId);
  saveCart(cart);
  return cart;
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
}

export function getCartTotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
}

export function getCartCount(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}
