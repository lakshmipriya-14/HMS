import { createUyirinaiApiClient } from '@multispeciality-hms/api-client';
import { Platform } from 'react-native';

// In Android emulator 10.0.2.2 points to host localhost; for iOS / web localhost works.
const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') {
    if (envUrl && !envUrl.includes('10.0.2.2')) {
      return envUrl;
    }
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:4000/api/v1`;
    }
    return 'http://localhost:4000/api/v1';
  }
  if (Platform.OS === 'android') {
    if (envUrl) {
      if (envUrl.includes('localhost')) {
        return envUrl.replace('localhost', '10.0.2.2');
      }
      return envUrl;
    }
    return 'http://10.0.2.2:4000/api/v1';
  }
  return envUrl || 'http://localhost:4000/api/v1';
};

const API_BASE_URL = getBaseUrl();

let accessToken: string | null = null;
let refreshToken: string | null = null;
let unauthorized: (() => void) | undefined;
export const setMobileUnauthorizedHandler = (handler?: () => void) => { unauthorized = handler; };

export const mobileApiClient = createUyirinaiApiClient({
  baseURL: API_BASE_URL,
  cookieSession: false,
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
