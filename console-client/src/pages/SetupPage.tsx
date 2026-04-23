import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import {
  AuthShell,
  IconAlert,
  IconArrowRight,
  IconCheck,
  IconServer,
  IconShield,
  IconSpark,
  InputField,
} from '../components/ui';
import { useAuth } from '../contexts/useAuth';

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[22px] border border-rose-200/70 bg-rose-50/90 px-4 py-3.5 text-sm text-rose-700 shadow-[0_16px_30px_rgba(244,63,94,0.08)]">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-500">
        <IconAlert className="h-4 w-4" />
      </span>
      <span className="leading-6">{message}</span>
    </div>
  );
}

export function SetupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { token } = await authApi.setup(email, password, name || undefined);
      setToken(token);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="first-time setup"
      title="Create the first workspace admin"
      description="This initial account unlocks the console so you can connect services, monitor printers, and start sending jobs."
      introTitle="Stand up your print operations hub in a few calm steps."
      introBody="Create the first admin account and OpenPrinting will be ready for service registration, job routing, and real-time fleet management."
      introList={[
        { icon: <IconSpark className="h-5 w-5" />, label: 'A polished console experience from the first login, not an afterthought setup screen.' },
        { icon: <IconShield className="h-5 w-5" />, label: 'Secure local credentials to bootstrap the environment before broader auth is enabled.' },
        { icon: <IconServer className="h-5 w-5" />, label: 'Built for the next step: connecting agents, syncing printers, and routing print jobs.' },
      ]}
      footer={
        <div className="rounded-[24px] border border-sky-100 bg-sky-50/80 px-5 py-4 text-sm leading-6 text-slate-600">
          Tip: use the name field if you want a friendlier owner label in the dashboard, otherwise email works fine.
        </div>
      }
    >
      <div className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <form onSubmit={submit} className="space-y-4">
          <InputField
            label="Display name"
            hint="optional"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Alex Smith"
            autoComplete="name"
          />
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <InputField
            label="Password"
            hint="8+ characters"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create a strong password"
            required
            minLength={8}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-500 bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(37,99,235,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(37,99,235,0.3)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Creating account
              </>
            ) : (
              <>
                Create admin account
                <IconArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="rounded-[24px] border border-slate-200/80 bg-white/85 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <IconCheck className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-950">What happens next</div>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                After setup, you will land in the dashboard where you can connect Windows printing services and start routing jobs immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
