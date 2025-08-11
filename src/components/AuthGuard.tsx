import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the current location to redirect back after login
      const returnUrl = location.pathname + location.search;
      navigate(redirectTo, { 
        state: { returnUrl },
        replace: true 
      });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, location]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <div className="bg-white rounded-lg p-6 shadow-lg space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
