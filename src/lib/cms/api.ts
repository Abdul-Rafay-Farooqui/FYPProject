const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

async function request(url: string, options?: RequestInit) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
    if (!res.ok) {
      let errorMsg = res.statusText;
      try {
        const errorBody = await res.json();
        errorMsg = errorBody.message || errorBody.error || errorMsg;
      } catch { /* ignore parse errors */ }
      throw new Error(errorMsg);
    }
    return res.json();
  } catch (error: any) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server');
    }
    throw error;
  }
}

export const api = {
  get: (url: string) => request(url),
  post: (url: string, data: any) => request(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url: string, data: any) => request(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url: string) => request(url, { method: 'DELETE' }),
};
