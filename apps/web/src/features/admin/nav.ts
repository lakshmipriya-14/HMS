import { LayoutDashboard, Users, ShieldAlert } from 'lucide-react';
import { Role } from '@multispeciality-hms/contracts';
import { NavItem } from '../../types/navigation';

export const adminNavItems: NavItem[] = [
  {
    label: 'Hospital Admin',
    path: '/admin',
    icon: LayoutDashboard,
    roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.DEPARTMENT_ADMIN],
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: Users,
    roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN],
  },
  {
    label: 'Audit Trail',
    path: '/admin/audit',
    icon: ShieldAlert,
    roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN],
  },
];
