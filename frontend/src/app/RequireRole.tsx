import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function RequireRole({ role: requiredRole, children }: { role: string, children: React.ReactNode }) {
  const { role, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== requiredRole) {
    return <Navigate to="/forbidden" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
