'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface AuthUser {
  id?: number;
  email: string;
  name: string;
  role: string;
  token?: string;
  status?: string;
  mosque_id?: number | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    const storedToken = localStorage.getItem('auth_token');
    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({ ...parsed, token: storedToken });
      } catch {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    }
    setIsHydrated(true);
  }, []);

  const login = useCallback((u: AuthUser, token: string) => {
    const userData = { ...u, token };
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_token', token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  }, []);

  if (!isHydrated) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
