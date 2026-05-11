'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  nama: string;
  nip: string;
  isRegistered: boolean;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (nip: string) => Promise<{ needsRegistration: boolean }>;
  register: (nama: string, nip: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('hrd_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        Promise.resolve().then(() => setUser(parsed));
      } catch {
        localStorage.removeItem('hrd_user');
      }
    }
    Promise.resolve().then(() => setIsLoading(false));
  }, []);

  const login = async (nip: string): Promise<{ needsRegistration: boolean }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip }),
      });
      const data = await res.json();

      if (data.user) {
        setUser(data.user);
        localStorage.setItem('hrd_user', JSON.stringify(data.user));
        return { needsRegistration: false };
      }
      return { needsRegistration: true };
    } catch {
      return { needsRegistration: true };
    }
  };

  const register = async (nama: string, nip: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, nip }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('hrd_user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hrd_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
