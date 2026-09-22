import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onUnauthorized, setAuthToken } from '../api/client';
import { authApi } from '../api/endpoints';

interface AuthState {
  token: string | null;
  email: string | null;
  role: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Session persistée dans sessionStorage (token + email + rôle) pour survivre au refresh.
 * Compromis assumé : sessionStorage (et non localStorage) → effacé à la fermeture de
 * l'onglet, ce qui limite l'exposition. Le token expire de toute façon côté API (12 h).
 */
const STORAGE_KEY = 'frameforge.session';

function readSession(): AuthState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as AuthState;
      if (s.token) return s;
    }
  } catch { /* stockage illisible → session vide */ }
  return { token: null, email: null, role: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // Lazy-init : on restaure la session ET on amorce axios AVANT le 1er rendu — donc avant les
  // effets des enfants (CartProvider) qui déclenchent les premiers appels authentifiés.
  const [state, setState] = useState<AuthState>(() => {
    const s = readSession();
    setAuthToken(s.token);
    return s;
  });

  useEffect(() => {
    setAuthToken(state.token);
  }, [state.token]);

  function apply(token: string, email: string, role: string) {
    // Le cache React Query contient des données privées (commandes, administration).
    // Une identité ne doit jamais hériter du cache de la session précédente.
    void queryClient.cancelQueries();
    queryClient.clear();
    setAuthToken(token);
    setState({ token, email, role });
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, email, role }));
  }

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password);
    apply(res.token, res.email, res.role);
  }

  async function register(email: string, password: string) {
    const res = await authApi.register(email, password);
    apply(res.token, res.email, res.role);
  }

  function logout() {
    void queryClient.cancelQueries();
    queryClient.clear();
    setAuthToken(null);
    setState({ token: null, email: null, role: null });
    sessionStorage.removeItem(STORAGE_KEY);
  }

  // Token expiré/invalide (401 sur une requête authentifiée) → on déconnecte proprement.
  useEffect(() => {
    onUnauthorized(() => {
      void queryClient.cancelQueries();
      queryClient.clear();
      setAuthToken(null);
      setState({ token: null, email: null, role: null });
      sessionStorage.removeItem(STORAGE_KEY);
    });
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated: !!state.token,
        isAdmin: state.role === 'Admin',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
