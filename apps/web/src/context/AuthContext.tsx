import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface AccessibleModule {
  code: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  source?: string;
}

interface ProfessionalAssignmentDoc {
  id: string;
  name: string;
  date: string;
  filePath: string;
}

interface ProfessionalAssignmentInfo {
  id: number;
  facilityId: string;
  facilityName: string;
  dangerClass?: string | null;
  employeeCount?: number | null;
  type: string;
  durationMinutes: number;
  isFullTime: boolean;
  startDate: string;
  endDate?: string | null;
  status: string;
  documents: ProfessionalAssignmentDoc[];
}

interface ProfessionalProfile {
  id: number;
  fullName: string;
  employmentType: string;
  osgbName?: string | null;
  titleClass: string;
  certificateNo?: string | null;
  certificateDate?: string | null;
  certificateStatus?: {
    isExpired: boolean;
    isWarning: boolean;
    isCritical: boolean;
    daysLeft: number | null;
  } | null;
  totalAssignedMinutes: number;
  assignments: ProfessionalAssignmentInfo[];
}

interface User {
  username: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  department?: string | null;
  employmentType?: string | null;
  osgbName?: string | null;
  telegramChatId?: string | null;
  hasTelegram?: boolean;
  roles: string[];
  facilities: string[];
  modules: string[];
  accessibleModules?: AccessibleModule[];
  professionalProfile?: ProfessionalProfile | null;
  isAdmin: boolean;
  isManagement: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
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

  const login = async (username: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { username });

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
    try {
      sessionStorage.removeItem('post_login_redirect');
    } catch {
      // ignore
    }
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
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser: fetchMe }}>
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
