import { createAalayamApiClient } from '@multispeciality-hms/api-client';

let accessToken: string | null = null;
let unauthorized: (() => void) | undefined;
export const setWebUnauthorizedHandler = (handler?: () => void) => { unauthorized = handler; };

export const apiClient = createAalayamApiClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  cookieSession: true,
  getAccessToken: () => accessToken,
  setTokens: access => { accessToken = access; },
  clearTokens: () => { accessToken = null; },
  onUnauthorized: () => unauthorized?.(),
});

// Discard credentials persisted by the previous demo implementation.
try {
  for (const key of ['aalayam_access_token', 'aalayam_refresh_token', 'aalayam_user']) localStorage.removeItem(key);
} catch {
  // Browser storage can be unavailable in restricted contexts.
}
