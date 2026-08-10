'use client';

import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

export const TOKEN_KEY = 'weconnect_token';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  Cookies.set(TOKEN_KEY, token, {
    expires: 30,
    sameSite: 'lax',
    path: '/',
  });
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  Cookies.remove(TOKEN_KEY, { path: '/' });
}

/** Singleton axios client with JWT auth injection. */
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      clearToken();
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  },
);