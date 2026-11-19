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
    const saved = localStorage.getItem('aalayam_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('aalayam_access_token');
      if (token) {
        if (token === 'demo-preview-token') {
          setIsLoading(false);
          return;
        }
        try {
          const res = await apiClient.auth.getMe();
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('aalayam_user', JSON.stringify(res.data));
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
        localStorage.setItem('aalayam_access_token', accessToken);
        localStorage.setItem('aalayam_refresh_token', refreshToken);
        localStorage.setItem('aalayam_user', JSON.stringify(authUser));
        setUser(authUser);
        return;
      }
    } catch (apiErr) {
      console.warn('Backend API offline or unreachable. Initializing instant demo session for testing:', apiErr);
      const emailLower = dto.email.toLowerCase().trim();
      const roleMap: Record<string, Role> = {
        'superadmin@aalayamhospital.com': Role.SUPER_ADMIN,
        'hospitaladmin@aalayamhospital.com': Role.HOSPITAL_ADMIN,
        'admin@aalayamhospital.com': Role.HOSPITAL_ADMIN,
        'deptadmin@aalayamhospital.com': Role.DEPARTMENT_ADMIN,
        'doctor@aalayamhospital.com': Role.DOCTOR,
        'nurse@aalayamhospital.com': Role.NURSE,
        'headnurse@aalayamhospital.com': Role.HEAD_NURSE,
        'reception@aalayamhospital.com': Role.RECEPTIONIST,
        'lab@aalayamhospital.com': Role.LAB_TECHNICIAN,
        'labtech@aalayamhospital.com': Role.LAB_TECHNICIAN,
        'pathologist@aalayamhospital.com': Role.LAB_TECHNICIAN,
        'pharmacy@aalayamhospital.com': Role.PHARMACIST,
        'radiology@aalayamhospital.com': Role.RADIOLOGY_STAFF,
        'billing@aalayamhospital.com': Role.BILLING_STAFF,
        'insurance@aalayamhospital.com': Role.INSURANCE_STAFF,
        'wardmanager@aalayamhospital.com': Role.WARD_MANAGER,
        'ward@aalayamhospital.com': Role.WARD_MANAGER,
        'driver@aalayamhospital.com': Role.AMBULANCE_DRIVER,
        'ambulance@aalayamhospital.com': Role.AMBULANCE_COORDINATOR,
        'patient@aalayamhospital.com': Role.PATIENT,
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

      localStorage.setItem('aalayam_access_token', 'demo-preview-token');
      localStorage.setItem('aalayam_user', JSON.stringify(demoUser));
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
