const BASE = '/api';

async function request<T>(path: string): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export interface AgentPrinter {
  name: string;
  isDefault: boolean;
}

export interface Agent {
  id: number;
  machineName: string;
  lastSeen: string;
  registeredAt: string;
  isOnline: boolean;
  user: { email: string; displayName: string | null };
  printers: AgentPrinter[];
}

export const agentsApi = {
  getAgents: () => request<Agent[]>('/agents'),
};
