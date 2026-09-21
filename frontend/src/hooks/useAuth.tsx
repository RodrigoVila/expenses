import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, setOnUnauthorized } from '@/lib/api';
import { tokenStore } from '@/lib/auth';
import type { AuthResponse, User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    qc.clear();
  }, [qc]);

  // Al arrancar, si hay token, valida contra /auth/me
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<User>('/auth/me')
      .then(setUser)
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Wire callback global: si algún request devuelve 401, cerramos sesión
  useEffect(() => {
    setOnUnauthorized(() => {
      tokenStore.clear();
      setUser(null);
      qc.clear();
    });
  }, [qc]);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await api.post<AuthResponse>('/auth/google', { credential });
    tokenStore.set(res.token);
    setUser(res.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
