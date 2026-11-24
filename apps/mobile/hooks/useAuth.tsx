import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUserDto, LoginRequestDto } from '@multispeciality-hms/contracts';
import { mobileApiClient, setMobileUnauthorizedHandler } from '../services/api';
import { clearPendingLogout, isLogoutPending, markPendingLogout } from '@multispeciality-hms/api-client';

interface AuthContextType {
  user: AuthUserDto | null;
  isLoading: boolean;
  login: (dto: LoginRequestDto) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setMobileUnauthorizedHandler(() => setUser(null));
    const restore = async () => {
      try {
        if (isLogoutPending()) {
          await mobileApiClient.auth.logout();
          clearPendingLogout();
          return;
        }
        const session = await mobileApiClient.auth.restore();
        if (mounted) setUser(session.user);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void restore();
    return () => { mounted = false; setMobileUnauthorizedHandler(undefined); };
  }, []);

  const login = async (dto: LoginRequestDto) => {
    if (isLogoutPending()) await mobileApiClient.auth.logout();
    const response = await mobileApiClient.auth.login(dto);
    if (!response.data) throw new Error('No session returned.');
    clearPendingLogout();
    setUser(response.data.user);
  };
  const logout = async () => {
    markPendingLogout();
    try {
      await mobileApiClient.auth.logout();
      clearPendingLogout();
    } finally {
      setUser(null);
    }
  };
  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}

