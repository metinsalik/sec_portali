import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface User {
  username: string;
  fullName: string;
  roles: string[];
  facilities: string[];
  isAdmin: boolean;
  isManagement: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username?: string) => {
    setIsLoading(true);
    try {
      const res = username
        ? await api.post('/auth/login', { username })
        : await api.get('/auth/login');

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Giriş başarısız.');
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    toast.info('Çıkış yapıldı');
  }, []);

  // Session timeout warning
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // JWT payload decode (exp claim kontrolü)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expTime = payload.exp * 1000; // ms'ye çevir
      const now = Date.now();

      // 30 dakika kala uyar
      const warningTime = expTime - 30 * 60 * 1000;
      const warnDelay = warningTime - now;

      if (warnDelay > 0 && warnDelay < 8 * 60 * 60 * 1000) {
        const warningTimer = setTimeout(() => {
          toast.warning('Oturumunuz 30 dakika içinde sona erecek', {
            description: 'Devam etmek için lütfen sayfayı yenileyin',
            duration: 10000,
          });
        }, warnDelay);

        return () => clearTimeout(warningTimer);
      }
    } catch {
      // Token decode hatası - ignore
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchMe();
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
