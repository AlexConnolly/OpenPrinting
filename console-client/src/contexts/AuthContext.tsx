import { useEffect, useState, type ReactNode } from 'react';
import { authApi, type Me } from '../api/auth';
import { AuthContext } from './auth-context';

const initialToken = localStorage.getItem('token');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setStoredToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(Boolean(initialToken));

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadUser = async () => {
      try {
        const nextUser = await authApi.me();
        if (!cancelled) setUser(nextUser);
      } catch {
        localStorage.removeItem('token');
        if (!cancelled) {
          setStoredToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const setToken = (nextToken: string) => {
    localStorage.setItem('token', nextToken);
    setLoading(true);
    setStoredToken(nextToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setStoredToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
