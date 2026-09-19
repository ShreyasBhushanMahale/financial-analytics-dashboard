import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageStatus } from '../components/common/FullPageStatus';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute() {
  const { status, retry } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageStatus kind="loading" />;
  if (status === 'unavailable') return <FullPageStatus kind="unavailable" onRetry={retry} />;
  if (status === 'anonymous') {
    // Remember where the user was heading, so login can send them back there.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
