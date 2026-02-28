import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Route guard — redirects to /auth if no authenticated owner session.
 * Wraps owner-only routes (setup, dashboard).
 */
const OwnerGuard: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};

export default OwnerGuard;
