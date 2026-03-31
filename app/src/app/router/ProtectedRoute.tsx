import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers';
import { ROUTES } from './routeConfig';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <>{children}</>;
}
