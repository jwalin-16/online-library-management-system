import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser } from '../services/types';
import { db } from '../services/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AdminUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'lms_current_admin';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check saved session
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            const admin = db.getAdmin();
            setUser({
              ...admin,
              email: data.session.user.email || admin.email,
            });
            setIsLoading(false);
            return;
          }
        }

        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          setUser(JSON.parse(saved));
        } else {
          // Default to null so user must authenticate, or can use quick-fill
          setUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // 1. If Supabase auth is configured, attempt Supabase sign-in
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (error) {
          // If Supabase fails, check if default credentials match for offline/demo access
          if (email.trim().toLowerCase() !== 'admin@library.edu' || pass !== 'admin123') {
            setIsLoading(false);
            return { success: false, error: error.message };
          }
        } else if (data?.user) {
          const adminProfile = db.getAdmin();
          const loggedUser: AdminUser = {
            ...adminProfile,
            id: data.user.id,
            email: data.user.email || email,
            lastLogin: new Date().toISOString(),
          };
          setUser(loggedUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
          setIsLoading(false);
          return { success: true };
        }
      }

      // 2. Local verification against admin record
      const currentAdmin = db.getAdmin();
      const storedPassword = localStorage.getItem('lms_admin_password') || 'admin123';

      if (
        (email.trim().toLowerCase() === currentAdmin.email.toLowerCase() || email.trim().toLowerCase() === 'admin@library.edu') &&
        pass === storedPassword
      ) {
        const loggedUser: AdminUser = {
          ...currentAdmin,
          email: email.trim().toLowerCase(),
          lastLogin: new Date().toISOString(),
        };
        setUser(loggedUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: 'Invalid email or password. Default is admin@library.edu / admin123.' };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Authentication failed' };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Supabase signOut error:', e);
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateProfile = async (updates: Partial<AdminUser>) => {
    const updated = await db.updateAdmin(updates);
    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
