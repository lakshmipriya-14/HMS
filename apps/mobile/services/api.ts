import { createUyirinaiApiClient } from '@multispeciality-hms/api-client';
import { Platform } from 'react-native';

// In Android emulator 10.0.2.2 points to host localhost; for iOS / web localhost works.
const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4000/api/v1' : 'http://localhost:4000/api/v1';
const API_BASE_URL =
  Platform.OS === 'web' && process.env.EXPO_PUBLIC_API_URL?.includes('10.0.2.2')
    ? 'http://localhost:4000/api/v1'
    : (process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL);

let accessToken: string | null = null;
let refreshToken: string | null = null;
let unauthorized: (() => void) | undefined;
export const setMobileUnauthorizedHandler = (handler?: () => void) => { unauthorized = handler; };

export const mobileApiClient = createUyirinaiApiClient({
  baseURL: API_BASE_URL,
  cookieSession: Platform.OS === 'web',
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  setTokens: (access, refresh) => {
    accessToken = access;
    refreshToken = refresh;
  },
  clearTokens: () => {
    accessToken = null;
    refreshToken = null;
  },
  onUnauthorized: () => {
    unauthorized?.();
  },
});

export const setMobileTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
};

export const clearMobileTokens = () => {
  accessToken = null;
  refreshToken = null;
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: any;
    params?: Record<string, string | number | boolean | undefined>;
  } = {}
): Promise<{ data: T; message?: string }> {
  const method = options.method || 'GET';
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(options.params)) {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      unauthorized?.();
    }
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json;
}

