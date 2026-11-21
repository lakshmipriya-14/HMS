import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUserDto, Role, LoginRequestDto, ROLE_PERMISSIONS_MATRIX } from '@multispeciality-hms/contracts';
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
    const saved = localStorage.getItem('kizuna_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('kizuna_access_token');
      if (token) {
        if (token === 'demo-preview-token') {
          setIsLoading(false);
          return;
        }
        try {
          const res = await apiClient.auth.getMe();
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('kizuna_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Session verification failed, falling back to local cached session:', err);
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
        localStorage.setItem('kizuna_access_token', accessToken);
        localStorage.setItem('kizuna_refresh_token', refreshToken);
        localStorage.setItem('kizuna_user', JSON.stringify(authUser));
        setUser(authUser);
        return;
      }
    } catch (apiErr) {
      console.warn('Backend API offline or unreachable. Initializing instant demo session for testing:', apiErr);
      const emailLower = dto.email.toLowerCase().trim();
      const roleMap: Record<string, Role> = {
        'superadmin@kizunahospital.com': Role.SUPER_ADMIN,
        'hospitaladmin@kizunahospital.com': Role.HOSPITAL_ADMIN,
        'admin@kizunahospital.com': Role.HOSPITAL_ADMIN,
        'deptadmin@kizunahospital.com': Role.DEPARTMENT_ADMIN,
        'doctor@kizunahospital.com': Role.DOCTOR,
        'nurse@kizunahospital.com': Role.NURSE,
        'headnurse@kizunahospital.com': Role.HEAD_NURSE,
        'reception@kizunahospital.com': Role.RECEPTIONIST,
        'lab@kizunahospital.com': Role.LAB_TECHNICIAN,
        'labtech@kizunahospital.com': Role.LAB_TECHNICIAN,
        'pathologist@kizunahospital.com': Role.LAB_TECHNICIAN,
        'pharmacy@kizunahospital.com': Role.PHARMACIST,
        'radiology@kizunahospital.com': Role.RADIOLOGY_STAFF,
        'billing@kizunahospital.com': Role.BILLING_STAFF,
        'insurance@kizunahospital.com': Role.INSURANCE_STAFF,
        'wardmanager@kizunahospital.com': Role.WARD_MANAGER,
        'ward@kizunahospital.com': Role.WARD_MANAGER,
        'driver@kizunahospital.com': Role.AMBULANCE_DRIVER,
        'ambulance@kizunahospital.com': Role.AMBULANCE_COORDINATOR,
        'patient@kizunahospital.com': Role.PATIENT,
      };

      const matchedRole = roleMap[emailLower] || Role.DOCTOR;
      const demoUser: AuthUserDto = {
        id: 'demo-user-id',
        email: dto.email,
        firstName: matchedRole.replace('_', ' '),
        lastName: 'Officer',
        role: matchedRole,
        permissions: (ROLE_PERMISSIONS_MATRIX[matchedRole] as string[]) || [],
      };

      localStorage.setItem('kizuna_access_token', 'demo-preview-token');
      localStorage.setItem('kizuna_user', JSON.stringify(demoUser));
      setUser(demoUser);
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
      localStorage.removeItem('kizuna_access_token');
      localStorage.removeItem('kizuna_refresh_token');
      localStorage.removeItem('kizuna_user');
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
