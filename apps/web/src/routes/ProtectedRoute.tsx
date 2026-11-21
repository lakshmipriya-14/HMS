import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '@multispeciality-hms/contracts';
import { LoadingState } from '../components/LoadingState';
import { ALL_NAV_ITEMS } from '../components/navigationRegistry';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading, hasRole } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) {
    return <LoadingState message="Verifying hospital security credentials..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const workspace = ALL_NAV_ITEMS.filter(item => pathname === item.path || pathname.startsWith(item.path + '/'))
    .sort((a, b) => b.path.length - a.path.length)[0];
  const roles = allowedRoles ?? workspace?.roles;
  if (roles && !hasRole(...roles)) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto mt-12">
        <h3 className="text-lg font-bold text-slate-800">Access Restricted by RBAC</h3>
        <p className="text-xs text-slate-500 mt-2">
          Your role ({user.role}) is not authorized to access this department's clinical workspace.
          Please contact Hospital Administration for permission escalation.
        </p>
      </div>
    );
  }

  return <Outlet />;
};
