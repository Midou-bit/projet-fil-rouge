import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { cartApi } from '../api/endpoints';
import type { Cart } from '../api/types';
import { useAuth } from './AuthContext';

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const activeToken = useRef(token);
  const requestVersion = useRef(0);

  useEffect(() => {
    activeToken.current = token;
  }, [token]);

  const applyLatest = useCallback(async (request: () => Promise<Cart>) => {
    const tokenAtStart = token;
    const version = ++requestVersion.current;
    const next = await request();
    if (tokenAtStart && activeToken.current === tokenAtStart && requestVersion.current === version) {
      setCart(next);
    }
  }, [token]);

  const refresh = useCallback(async () => {
    const tokenAtStart = token;
    const version = ++requestVersion.current;
    if (!tokenAtStart) {
      setCart(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await cartApi.get();
      if (activeToken.current === tokenAtStart && requestVersion.current === version) {
        setCart(next);
      }
    } finally {
      if (activeToken.current === tokenAtStart && requestVersion.current === version) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    // Synchronisation avec une source externe (l'API) : cas d'usage canonique d'un effect,
    // pas un dérivé de state — le state n'est modifié qu'après l'await, jamais synchrone ici.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh().catch(() => undefined);
    return () => { requestVersion.current += 1; };
  }, [refresh]);

  const addItem = async (productId: number, quantity = 1) => applyLatest(() => cartApi.add(productId, quantity));
  const updateItem = async (id: number, quantity: number) => applyLatest(() => cartApi.update(id, quantity));
  const removeItem = async (id: number) => applyLatest(() => cartApi.remove(id));
  const clear = async () => applyLatest(cartApi.clear);

  return (
    <CartContext.Provider value={{ cart, loading, refresh, addItem, updateItem, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
