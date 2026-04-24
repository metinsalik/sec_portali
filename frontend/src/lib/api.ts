const API_URL = import.meta.env.VITE_API_URL || '/api';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Token süresi dolmuşsa temizle
  if (response.status === 401) {
    localStorage.removeItem('token');
  }

  return response;
};

export const api = {
  get: (endpoint: string) =>
    apiFetch(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: unknown) =>
    apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: unknown) =>
    apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint: string, body: unknown) =>
    apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string) =>
    apiFetch(endpoint, { method: 'DELETE' }),
  customFetch: (endpoint: string, options: RequestInit) => {
    const token = localStorage.getItem('token');
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };
    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  }
};

export default api;
