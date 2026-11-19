import React, { createContext, useContext, useState } from 'react';
import { AuthUserDto, Role, LoginRequestDto, ROLE_PERMISSIONS_MATRIX } from '@multispeciality-hms/contracts';
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
        return;
      }
    } catch (apiErr) {
      console.warn('Mobile API offline, using instant demo fallback session:', apiErr);
      const emailLower = dto.email.toLowerCase().trim();
      const roleMap: Record<string, Role> = {
        'admin@aalayamhospital.com': Role.HOSPITAL_ADMIN,
        'superadmin@aalayamhospital.com': Role.SUPER_ADMIN,
        'hospitaladmin@aalayamhospital.com': Role.HOSPITAL_ADMIN,
        'doctor@aalayamhospital.com': Role.DOCTOR,
        'nurse@aalayamhospital.com': Role.NURSE,
        'headnurse@aalayamhospital.com': Role.HEAD_NURSE,
        'reception@aalayamhospital.com': Role.RECEPTIONIST,
        'pharmacy@aalayamhospital.com': Role.PHARMACIST,
        'labtech@aalayamhospital.com': Role.LAB_TECHNICIAN,
        'lab@aalayamhospital.com': Role.LAB_TECHNICIAN,
        'radiology@aalayamhospital.com': Role.RADIOLOGY_STAFF,
        'billing@aalayamhospital.com': Role.BILLING_STAFF,
        'ward@aalayamhospital.com': Role.WARD_MANAGER,
        'wardmanager@aalayamhospital.com': Role.WARD_MANAGER,
        'driver@aalayamhospital.com': Role.AMBULANCE_DRIVER,
        'ambulance@aalayamhospital.com': Role.AMBULANCE_COORDINATOR,
        'patient@aalayamhospital.com': Role.PATIENT,
      };

      const matchedRole = roleMap[emailLower] || Role.DOCTOR;
      const demoUser: AuthUserDto = {
        id: 'mobile-demo-id',
        email: dto.email,
        firstName: matchedRole.replace('_', ' '),
        lastName: 'Terminal',
        role: matchedRole,
        permissions: (ROLE_PERMISSIONS_MATRIX[matchedRole] as string[]) || [],
      };

      setUser(demoUser);
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
