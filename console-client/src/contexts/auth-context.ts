import { createContext } from 'react';
import { type Me } from '../api/auth';

export interface AuthContextValue {
  user: Me | null;
  loading: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
