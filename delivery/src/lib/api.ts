const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body instanceof FormData) delete headers['Content-Type'];

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro de conexão' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    login: (login: string, password: string) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),
    me: () => request('/auth/me'),
    changePassword: (currentPassword: string, newPassword: string) =>
      request('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
  },
  delivery: {
    routes: () => request('/delivery/routes'),
    startRoute: (id: number) => request(`/delivery/routes/${id}/start`, { method: 'PUT' }),
    finishRoute: (id: number) => request(`/delivery/routes/${id}/finish`, { method: 'PUT' }),
    updateStatus: (routeId: number, packageId: number, data: FormData) =>
      request(`/delivery/routes/${routeId}/packages/${packageId}`, { method: 'PUT', body: data }),
  },
};
