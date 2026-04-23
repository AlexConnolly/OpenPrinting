import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { authApi } from './api/auth';
import { CenteredStatus } from './components/ui';

function SetupGuard({ children }: { children: ReactNode }) {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    authApi.needsSetup().then(r => setNeedsSetup(r.needsSetup)).catch(() => setNeedsSetup(false));
  }, []);

  if (needsSetup === null) {
    return (
      <CenteredStatus
        title="Preparing OpenPrinting"
        description="Checking whether this instance still needs its first-time setup."
        icon={<span className="h-7 w-7 rounded-full border-2 border-sky-200 border-t-sky-600 animate-spin" />}
      />
    );
  }
  if (needsSetup) return <Navigate to="/setup" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<SetupGuard><LoginPage /></SetupGuard>} />
          <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
