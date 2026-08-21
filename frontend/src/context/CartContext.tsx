import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { api, CartSummary, getToken } from '../api/client';
import { useAuth } from './AuthContext';

interface CartContextValue {
  cart: CartSummary;
  refresh: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
}

const emptyCart: CartSummary = { items: [], subtotalCents: 0, itemCount: 0 };

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartSummary>(emptyCart);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setCart(emptyCart);
      return;
    }
    try {
      const summary = await api.getCart();
      setCart(summary);
    } catch {
      setCart(emptyCart);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [user, refresh]);

  async function addToCart(productId: string, quantity = 1) {
    const summary = await api.addToCart(productId, quantity);
    setCart(summary);
  }

  async function updateItem(itemId: string, quantity: number) {
    const summary = await api.updateCartItem(itemId, quantity);
    setCart(summary);
  }

  async function removeItem(itemId: string) {
    const summary = await api.removeCartItem(itemId);
    setCart(summary);
  }

  return (
    <CartContext.Provider value={{ cart, refresh, addToCart, updateItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
