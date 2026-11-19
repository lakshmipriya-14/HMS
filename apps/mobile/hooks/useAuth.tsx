import React, { createContext, useContext, useState } from 'react';
import { AuthUserDto, Role, LoginRequestDto } from '@multispeciality-hms/contracts';
import { mobileApiClient, setMobileTokens, clearMobileTokens } from '../services/api';

interface AuthContextType {
  user: AuthUserDto | null;
  isLoading: boolean;
  login: (dto: LoginRequestDto) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (dto: LoginRequestDto) => {
    setIsLoading(true);
    try {
      const res = await mobileApiClient.auth.login(dto);
      if (res.data) {
        setMobileTokens(res.data.accessToken, res.data.refreshToken);
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    clearMobileTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
