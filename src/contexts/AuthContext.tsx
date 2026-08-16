import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    fullName: string;
    role: 'USER' | 'OWNER' | 'ADMIN';
    inviteSecret?: string;
    referralCode?: string;
  }) => Promise<{ userId: string; userRole?: 'USER' | 'OWNER' | 'ADMIN'; accessToken?: string; refreshToken?: string; user?: User; delivery?: { devOtp?: string; disabled?: boolean } }>;
  verifyOtp: (userId: string, otp: string) => Promise<void>;
  loginWithOtp: (userId: string, otp: string) => Promise<User>;
  updateProfile: (data: {
    fullName?: string;
    avatarUrl?: string | null;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is logged in on app start
  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');
    
    if (token) {
      try {
        if (userData) {
          setUser(JSON.parse(userData));
        }
        authApi.me()
          .then((freshUser) => {
            if (cancelled) return;
            setUser(freshUser);
            localStorage.setItem('userData', JSON.stringify(freshUser));
          })
          .catch(() => {
            if (cancelled) return;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userData');
            setUser(null);
          })
          .finally(() => {
            if (!cancelled) setIsLoading(false);
          });
        return () => {
          cancelled = true;
        };
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      const userData = response.user;
      
      setUser(userData);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully logged in.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'Please check your credentials.',
      });
      throw error;
    }
  };

  const signup = async (data: {
    email: string;
    password: string;
    fullName: string;
    role: 'USER' | 'OWNER' | 'ADMIN';
    inviteSecret?: string;
    referralCode?: string;
  }) => {
    try {
      const response = await authApi.signup(data);
      
      if (response.accessToken && response.user) {
        localStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        localStorage.setItem('userData', JSON.stringify(response.user));
        setUser(response.user);
      }
      
      toast({
        title: 'Account created successfully!',
        description: 'Welcome to QuickCourt.',
      });
      
      return response;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: error.message || 'Please try again.',
      });
      throw error;
    }
  };

  const verifyOtp = async (userId: string, otp: string) => {
    try {
      await authApi.verifyOtp({ userId, otp });
      
      toast({
        title: 'Email verified!',
        description: 'Your account has been successfully verified.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: error.message || 'Please check your verification code.',
      });
      throw error;
    }
  };

  const loginWithOtp = async (userId: string, otp: string) => {
    try {
      const response = await authApi.verifyLoginOtp({ userId, otp });

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('userData', JSON.stringify(response.user));
      setUser(response.user);

      toast({
        title: 'Welcome back!',
        description: 'You have been securely logged in.',
      });

      return response.user;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: error.message || 'Please check your login code.',
      });
      throw error;
    }
  };

  const updateProfile = async (data: {
    fullName?: string;
    avatarUrl?: string | null;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    try {
      const updated = await authApi.updateProfile(data);
      setUser(updated);
      localStorage.setItem('userData', JSON.stringify(updated));
      return updated;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Profile update failed',
        description: error.message || 'Please try again.',
      });
      throw error;
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      // Fire and forget logout API call
      authApi.logout(refreshToken).catch(() => {
        // Ignore errors during logout
      });
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    setUser(null);
    
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    verifyOtp,
    loginWithOtp,
    updateProfile,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
