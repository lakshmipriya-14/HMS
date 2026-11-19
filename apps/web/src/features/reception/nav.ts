import { UserPlus } from 'lucide-react';
import { Role } from '@multispeciality-hms/contracts';
import { NavItem } from '../../types/navigation';

export const receptionNavItems: NavItem[] = [
  {
    label: 'Reception & Registration',
    path: '/reception',
    icon: UserPlus,
    roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.RECEPTIONIST],
  },
];
