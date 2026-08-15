export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const BASE_URL = API_URL.replace('/api', '');

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Only add application/json if body is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
  }

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
    apiFetch(endpoint, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (endpoint: string, body: unknown) =>
    apiFetch(endpoint, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: (endpoint: string, body: unknown) =>
    apiFetch(endpoint, { method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body) }),
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
