import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { CenteredStatus } from './ui';
import { useAuth } from '../contexts/useAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <CenteredStatus
        title="Preparing your workspace"
        description="Checking the current session and loading the latest console state."
        icon={<span className="h-7 w-7 rounded-full border-2 border-sky-200 border-t-sky-600 animate-spin" />}
      />
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
