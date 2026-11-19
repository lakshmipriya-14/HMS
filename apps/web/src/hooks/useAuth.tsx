import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUserDto, Role, LoginRequestDto } from '@multispeciality-hms/contracts';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: AuthUserDto | null;
  isLoading: boolean;
  login: (dto: LoginRequestDto) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUserDto | null>(() => {
    const saved = localStorage.getItem('aalayam_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('aalayam_access_token');
      if (token) {
        try {
          const res = await apiClient.auth.getMe();
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('aalayam_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Session verification failed:', err);
          setUser(null);
          localStorage.removeItem('aalayam_user');
          localStorage.removeItem('aalayam_access_token');
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (dto: LoginRequestDto) => {
    setIsLoading(true);
    try {
      const res = await apiClient.auth.login(dto);
      if (res.data) {
        const { accessToken, refreshToken, user: authUser } = res.data;
        localStorage.setItem('aalayam_access_token', accessToken);
        localStorage.setItem('aalayam_refresh_token', refreshToken);
        localStorage.setItem('aalayam_user', JSON.stringify(authUser));
        setUser(authUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('aalayam_access_token');
      localStorage.removeItem('aalayam_refresh_token');
      localStorage.removeItem('aalayam_user');
      setUser(null);
    }
  };

  const hasRole = (...roles: Role[]) => {
    if (!user) return false;
    if (user.role === Role.SUPER_ADMIN) return true;
    return roles.includes(user.role);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === Role.SUPER_ADMIN) return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
