const BASE = '/api';

export interface AuthConfig {
  oauthEnabled: boolean;
  localLoginEnabled: boolean;
}

export interface Me {
  id: number;
  email: string;
  displayName: string | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const authApi = {
  getConfig: () => request<AuthConfig>('/auth/config'),
  needsSetup: () => request<{ needsSetup: boolean }>('/auth/needs-setup'),
  setup: (email: string, password: string, name?: string) =>
    request<{ token: string }>('/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  initiateOAuth: (returnUrl?: string) =>
    request<{ url: string }>(`/auth/oauth/initiate${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`),
  me: () => request<Me>('/auth/me'),
};
