import type { CartItem } from "@/lib/client-types";

const cartKey = "cafeteria-cart-v1";

export function getCartItems() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(cartKey);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function setCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cartKey, JSON.stringify(items));
  window.dispatchEvent(new Event("cart:update"));
}

export function clearCart() {
  setCartItems([]);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
