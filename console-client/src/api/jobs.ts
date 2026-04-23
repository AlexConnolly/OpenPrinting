const BASE = '/api';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export type JobStatus = 'Pending' | 'Printing' | 'Completed' | 'Failed';

export interface PrintJob {
  id: number;
  agentId: number;
  printerName: string;
  fileName: string;
  status: JobStatus;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export const jobsApi = {
  list: (agentId?: number) =>
    request<PrintJob[]>(`/jobs${agentId != null ? `?agentId=${agentId}` : ''}`),

  submit: (agentId: number, printerName: string, file: File) => {
    const form = new FormData();
    form.append('agentId', String(agentId));
    form.append('printerName', printerName);
    form.append('file', file);
    return fetch(`${BASE}/jobs`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    }).then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      return res.json() as Promise<PrintJob>;
    });
  },

  submitUrl: (agentId: number, printerName: string, sourceUrl: string) => {
    const form = new FormData();
    form.append('agentId', String(agentId));
    form.append('printerName', printerName);
    form.append('sourceUrl', sourceUrl);
    return fetch(`${BASE}/jobs`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    }).then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      return res.json() as Promise<PrintJob>;
    });
  },
};
