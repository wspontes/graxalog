const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

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
  packages: {
    list: (params?: Record<string, string>) =>
      request(`/packages?${new URLSearchParams(params || {})}`),
    getById: (id: number) => request(`/packages/${id}`),
    update: (id: number, data: any) =>
      request(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    returnStock: (id: number) =>
      request(`/packages/${id}/return-stock`, { method: 'POST' }),
    history: (id: number) => request(`/packages/${id}/history`),
  },
  routes: {
    list: (params?: Record<string, string>) =>
      request(`/routes?${new URLSearchParams(params || {})}`),
    getById: (id: number) => request(`/routes/${id}`),
    create: (data: any) =>
      request('/routes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    reorder: (id: number, packageIds: number[]) =>
      request(`/routes/${id}/reorder`, { method: 'PUT', body: JSON.stringify({ packageIds }) }),
    transfer: (id: number, deliveryPersonId: number) =>
      request(`/routes/${id}/transfer`, { method: 'PUT', body: JSON.stringify({ deliveryPersonId }) }),
    split: (id: number, deliveryPersonId: number, packageIds: number[]) =>
      request(`/routes/${id}/split`, { method: 'POST', body: JSON.stringify({ deliveryPersonId, packageIds }) }),
  },
  deliveryPeople: {
    list: () => request('/delivery-people'),
    create: (data: any) =>
      request('/delivery-people', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request(`/delivery-people/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    resetPassword: (id: number, newPassword: string) =>
      request(`/delivery-people/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({ newPassword }) }),
    performance: (id: number) => request(`/delivery-people/${id}/performance`),
  },
  reports: {
    dashboard: () => request('/reports/dashboard'),
    deliveryByPeriod: (start?: string, end?: string) =>
      request(`/reports/delivery-by-period?start=${start || ''}&end=${end || ''}`),
    performance: () => request('/reports/delivery-person-performance'),
    avgRouteTime: () => request('/reports/average-route-time'),
    export: (params?: Record<string, string>) =>
      request(`/reports/export?${new URLSearchParams(params || {})}`),
  },
  import: {
    file: (formData: FormData) =>
      request('/import/file', { method: 'POST', body: formData }),
    manual: (data: any) =>
      request('/import/manual', { method: 'POST', body: JSON.stringify(data) }),
    uploadPhoto: (formData: FormData) =>
      request('/import/photo', { method: 'POST', body: formData }),
    conference: (qrCodeData: string) =>
      request('/import/conference', { method: 'POST', body: JSON.stringify({ qrCodeData }) }),
    divergent: (data: any) =>
      request('/import/conference/divergent', { method: 'POST', body: JSON.stringify(data) }),
    conferenceStatus: () => request('/import/conference/status'),
    conferenceFinish: () => request('/import/conference/finish', { method: 'POST' }),
  },
  delivery: {
    routes: (params?: Record<string, string>) =>
      request(`/delivery/routes?${new URLSearchParams(params || {})}`),
    routeDetail: (id: number) => request(`/delivery/routes/${id}`),
    startRoute: (id: number) => request(`/delivery/routes/${id}/start`, { method: 'PUT' }),
    finishRoute: (id: number) => request(`/delivery/routes/${id}/finish`, { method: 'PUT' }),
    updateStatus: (routeId: number, packageId: number, data: FormData) =>
      request(`/delivery/routes/${routeId}/packages/${packageId}`, { method: 'PUT', body: data }),
    edit: (routeId: number, packageId: number, data: any) =>
      request(`/admin/delivery/routes/${routeId}/packages/${packageId}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
};
