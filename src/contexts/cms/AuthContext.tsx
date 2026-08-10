'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, School } from '@/types/cms/database';
import { api } from '@/lib/cms/api';

interface AuthContextType {
  user: User | null;
  school: School | null;
  login: (data: any) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('cms_user');
      const storedSchool = localStorage.getItem('cms_school');
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedSchool) setSchool(JSON.parse(storedSchool));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await api.post('/api/cms/users/login', data);
      if (result.success && result.data) {
        setUser(result.data.user);
        setSchool(result.data.school);
        localStorage.setItem('cms_user', JSON.stringify(result.data.user));
        localStorage.setItem('cms_school', JSON.stringify(result.data.school));
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await api.post('/api/cms/users/register-school', data);
      if (result.success) {
        // Don't auto-login, just return success
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setSchool(null);
    localStorage.removeItem('cms_user');
    localStorage.removeItem('cms_school');
  };

  return (
    <AuthContext.Provider value={{ user, school, login, register, logout, loading }}>
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
