import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
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
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      setCart(await cartApi.get());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Synchronisation avec une source externe (l'API) : cas d'usage canonique d'un effect,
    // pas un dérivé de state — le state n'est modifié qu'après l'await, jamais synchrone ici.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const addItem = async (productId: number, quantity = 1) => setCart(await cartApi.add(productId, quantity));
  const updateItem = async (id: number, quantity: number) => setCart(await cartApi.update(id, quantity));
  const removeItem = async (id: number) => setCart(await cartApi.remove(id));
  const clear = async () => setCart(await cartApi.clear());

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
