import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CenteredStatus, IconCheck, IconSpark } from '../components/ui';
import { useAuth } from '../contexts/useAuth';

function isLoopback(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' && (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost');
  } catch {
    return false;
  }
}

export function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const token = params.get('token');
    const returnUrl = params.get('returnUrl');
    const error = params.get('error');

    if (!token) {
      navigate(`/login?error=${encodeURIComponent(error ?? 'unknown_error')}`, { replace: true });
      return;
    }

    if (returnUrl && isLoopback(returnUrl)) {
      fetch(`${returnUrl}?token=${encodeURIComponent(token)}`, { mode: 'no-cors' })
        .catch(() => {
          window.location.href = `${returnUrl}?token=${encodeURIComponent(token)}`;
        })
        .then(() => setDone(true));
      return;
    }

    setToken(token);
    navigate('/dashboard', { replace: true });
  }, [navigate, params, setToken]);

  if (done) {
    return (
      <CenteredStatus
        title="Sign-in complete"
        description="The desktop handoff succeeded. You can close this browser tab and continue in the printing service."
        icon={<IconCheck className="h-7 w-7" />}
      />
    );
  }

  return (
    <CenteredStatus
      title="Finalizing your session"
      description="Wrapping up the authentication callback and preparing the console."
      icon={
        <span className="relative flex h-7 w-7 items-center justify-center">
          <span className="absolute h-7 w-7 rounded-full border-2 border-sky-200 border-t-sky-600 animate-spin" />
          <IconSpark className="h-4 w-4 text-sky-600" />
        </span>
      }
    />
  );
}
