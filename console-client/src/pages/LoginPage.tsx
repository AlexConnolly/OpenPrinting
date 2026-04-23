import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, type AuthConfig } from '../api/auth';
import { useAuth } from '../contexts/useAuth';

function isLoopback(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' && (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost');
  } catch {
    return false;
  }
}

async function sendTokenToService(returnUrl: string, token: string): Promise<void> {
  await fetch(`${returnUrl}?token=${encodeURIComponent(token)}`, { mode: 'no-cors' }).catch(() => {
    window.location.href = `${returnUrl}?token=${encodeURIComponent(token)}`;
  });
}

export function LoginPage() {
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const { setToken, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const returnUrl = params.get('returnUrl');
  const desktopReturn = returnUrl && isLoopback(returnUrl) ? returnUrl : null;

  useEffect(() => {
    const paramError = params.get('error');
    if (paramError) setError(decodeURIComponent(paramError));
  }, [params]);

  useEffect(() => {
    if (user) {
      if (desktopReturn) {
        const token = localStorage.getItem('token');
        if (token) {
          sendTokenToService(desktopReturn, token).then(() => setDone(true));
          return;
        }
      }
      navigate('/dashboard', { replace: true });
      return;
    }
    authApi.getConfig().then(setConfig).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Unable to load sign-in options');
    });
  }, [desktopReturn, navigate, params, user]);

  const handleWithToken = async (token: string) => {
    if (desktopReturn) {
      await sendTokenToService(desktopReturn, token);
      setDone(true);
      return;
    }
    setToken(token);
    navigate('/dashboard', { replace: true });
  };

  const handleLocalLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await handleWithToken((await authApi.login(email, password)).token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async () => {
    setError('');
    try {
      window.location.href = (await authApi.initiateOAuth(desktopReturn ?? undefined)).url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start login');
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Device connected</p>
          <p className="mt-1 text-sm text-gray-500">You can close this tab.</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <span className="h-4 w-4 rounded-full border-2 border-gray-200 border-t-gray-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-base font-semibold text-gray-900">OpenPrinting</p>
          <p className="mt-1 text-sm text-gray-500">
            {desktopReturn ? 'Authenticate this device' : 'Sign in to your account'}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {error && (
            <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {config.oauthEnabled && (
            <button
              onClick={handleOAuth}
              className="w-full rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Continue with SSO
            </button>
          )}

          {config.oauthEnabled && config.localLoginEnabled && (
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          )}

          {config.localLoginEnabled && (
            <form onSubmit={handleLocalLogin} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                autoComplete="email"
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoComplete="current-password"
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}

          {!config.oauthEnabled && !config.localLoginEnabled && (
            <p className="text-sm text-gray-500">No login methods configured.</p>
          )}
        </div>
      </div>
    </div>
  );
}
