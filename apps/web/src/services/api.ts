import { createAalayamApiClient } from '@multispeciality-hms/api-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const apiClient = createAalayamApiClient({
  baseURL: API_BASE_URL,
  getAccessToken: () => localStorage.getItem('aalayam_access_token'),
  getRefreshToken: () => localStorage.getItem('aalayam_refresh_token'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('aalayam_access_token', accessToken);
    localStorage.setItem('aalayam_refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('aalayam_access_token');
    localStorage.removeItem('aalayam_refresh_token');
    localStorage.removeItem('aalayam_user');
  },
  onUnauthorized: () => {
    window.location.href = '/login';
  },
});
