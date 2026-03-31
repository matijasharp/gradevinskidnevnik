import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { ROUTES } from './routeConfig';

export function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  // Unauthenticated → marketing landing page
  // Authenticated → main app (reports as first real page)
  return <Navigate to={user ? ROUTES.REPORTS : ROUTES.LANDING} replace />;
}
