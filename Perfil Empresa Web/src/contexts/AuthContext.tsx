import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/api';

interface AuthCtx {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

const CLIENT_ID     = import.meta.env.VITE_OAUTH_CLIENT_ID     || '';
const CLIENT_SECRET = import.meta.env.VITE_OAUTH_CLIENT_SECRET || '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('empresa_token');
    const savedUser  = localStorage.getItem('empresa_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authService.login(email, password, CLIENT_ID, CLIENT_SECRET);
    if (data.user.profile_type !== 'company') {
      throw new Error('Esta plataforma es exclusiva para cuentas de empresa.');
    }
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('empresa_token', data.access_token);
    localStorage.setItem('empresa_user', JSON.stringify(data.user));
  };

  const logout = async () => {
    try { await authService.logout(); } catch (_) { /* noop */ }
    setToken(null);
    setUser(null);
    localStorage.removeItem('empresa_token');
    localStorage.removeItem('empresa_user');
  };

  const refreshProfile = async () => {
    try {
      const { data } = await authService.getProfile();
      setUser(data);
      localStorage.setItem('empresa_user', JSON.stringify(data));
    } catch (_) { /* noop */ }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
