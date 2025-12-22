// API Configuration
// Change this to your server IP when running locally
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Check if running in local server mode
export const isLocalServerMode = () => {
  return localStorage.getItem('useLocalServer') === 'true';
};

export const setLocalServerMode = (enabled: boolean, serverUrl?: string) => {
  localStorage.setItem('useLocalServer', enabled ? 'true' : 'false');
  if (serverUrl) {
    localStorage.setItem('localServerUrl', serverUrl);
  }
};

export const getApiUrl = () => {
  if (isLocalServerMode()) {
    const customUrl = localStorage.getItem('localServerUrl');
    return customUrl ? `${customUrl}/api` : API_BASE_URL;
  }
  return API_BASE_URL;
};

// Generic fetch wrapper with error handling
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${getApiUrl()}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'حدث خطأ في الاتصال' }));
      throw new Error(error.error || 'حدث خطأ في الاتصال');
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('لا يمكن الاتصال بالخادم. تأكد من تشغيل الخادم المحلي.');
    }
    throw error;
  }
}

// Subscribers API
export const subscribersApi = {
  getAll: () => apiFetch<any[]>('/subscribers'),
  create: (data: any) => apiFetch<any>('/subscribers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/subscribers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/subscribers/${id}`, { method: 'DELETE' }),
};

// Routers API
export const routersApi = {
  getAll: () => apiFetch<any[]>('/routers'),
  create: (data: any) => apiFetch<any>('/routers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/routers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/routers/${id}`, { method: 'DELETE' }),
};

// Sales API
export const salesApi = {
  getAll: () => apiFetch<any[]>('/sales'),
  create: (data: any) => apiFetch<any>('/sales', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/sales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/sales/${id}`, { method: 'DELETE' }),
};

// Staff API
export const staffApi = {
  getAll: () => apiFetch<any[]>('/staff'),
  create: (data: any) => apiFetch<any>('/staff', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/staff/${id}`, { method: 'DELETE' }),
};

// Auth API
export const authApi = {
  login: (username: string, password: string) => 
    apiFetch<any>('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  changePassword: (userId: string, oldPassword: string, newPassword: string) =>
    apiFetch<any>('/change-password', { method: 'PUT', body: JSON.stringify({ userId, oldPassword, newPassword }) }),
};

// Payments API
export const paymentsApi = {
  getAll: () => apiFetch<any[]>('/payments'),
  getBySubscriber: (subscriberId: string) => apiFetch<any[]>(`/payments/${subscriberId}`),
  create: (data: any) => apiFetch<any>('/payments', { method: 'POST', body: JSON.stringify(data) }),
};

// Activity Log API
export const activityLogApi = {
  getAll: () => apiFetch<any[]>('/activity-log'),
  create: (data: any) => apiFetch<any>('/activity-log', { method: 'POST', body: JSON.stringify(data) }),
};

// Test connection to local server
export const testServerConnection = async (serverUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(`${serverUrl}/api/staff`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
};
