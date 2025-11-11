'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '@/lib/api-client';
import { setAuthToken, removeAuthToken } from '@/lib/api';
import { UserResponse, LoginRequest } from '@/types/api';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated and fetch user data
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = Cookies.get('access_token');
        const savedUser = Cookies.get('user');
        
        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
          // Verify token is still valid
          try {
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
            Cookies.set('user', JSON.stringify(currentUser), { expires: 7 });
          } catch (error) {
            // Token is invalid, clear auth
            removeAuthToken();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        removeAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      const response = await authApi.login(credentials);
      
      // Store token and user data
      setAuthToken(response.access_token);
      setUser(response.user);
      Cookies.set('user', JSON.stringify(response.user), { expires: 7 });
      
      toast.success('Login successful!');
      
      // Redirect based on user role
      const roleBasedRedirect = {
        'patient': '/dashboard/patient',
        'doctor': '/dashboard/doctor',
        'admin': '/dashboard/admin',
        'pharmacy': '/dashboard/pharmacy',
        'diagnostic_center': '/dashboard/diagnostic-center',
        'nurse': '/dashboard/nurse',
      };
      
      const redirectPath = roleBasedRedirect[response.user.role as keyof typeof roleBasedRedirect] || '/dashboard';
      router.push(redirectPath);
      
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/auth/login');
  };

  const isAuthenticated = !!user;

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
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