import { createAalayamApiClient } from '@multispeciality-hms/api-client';
import { Platform } from 'react-native';

// In Android emulator 10.0.2.2 points to host localhost; for iOS / web localhost works.
const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4000/api/v1' : 'http://localhost:4000/api/v1';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL;

let accessToken: string | null = null;
let refreshToken: string | null = null;
let unauthorized: (() => void) | undefined;
export const setMobileUnauthorizedHandler = (handler?: () => void) => { unauthorized = handler; };

export const mobileApiClient = createAalayamApiClient({
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
