import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUserDto, LoginRequestDto, Role } from '@multispeciality-hms/contracts';
import { apiClient, setWebUnauthorizedHandler } from '../services/api';
import { clearPendingLogout, isLogoutPending, markPendingLogout } from '@multispeciality-hms/api-client';

interface AuthContextType {
  user: AuthUserDto | null;
  isLoading: boolean;
  login: (dto: LoginRequestDto) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setWebUnauthorizedHandler(() => setUser(null));
    const restore = async () => {
      try {
        if (isLogoutPending()) {
          await apiClient.auth.logout();
          clearPendingLogout();
          return;
        }
        const session = await apiClient.auth.restore();
        if (mounted) setUser(session.user);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void restore();
    return () => { mounted = false; setWebUnauthorizedHandler(undefined); };
  }, []);

  const login = async (dto: LoginRequestDto) => {
    if (isLogoutPending()) await apiClient.auth.logout();
    const response = await apiClient.auth.login(dto);
    if (!response.data) throw new Error('No session returned.');
    clearPendingLogout();
    setUser(response.data.user);
  };
  const logout = async () => {
    markPendingLogout();
    try {
      await apiClient.auth.logout();
      clearPendingLogout();
    } finally {
      setUser(null);
    }
  };
  return <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole: (...roles) => !!user && roles.includes(user.role), hasPermission: permission => !!user?.permissions.includes(permission) }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
