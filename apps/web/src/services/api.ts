import { createKizunaApiClient } from '@multispeciality-hms/api-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const apiClient = createKizunaApiClient({
  baseURL: API_BASE_URL,
  getAccessToken: () => localStorage.getItem('kizuna_access_token'),
  getRefreshToken: () => localStorage.getItem('kizuna_refresh_token'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('kizuna_access_token', accessToken);
    localStorage.setItem('kizuna_refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('kizuna_access_token');
    localStorage.removeItem('kizuna_refresh_token');
    localStorage.removeItem('kizuna_user');
  },
  onUnauthorized: () => {
    window.location.href = '/login';
  },
});
