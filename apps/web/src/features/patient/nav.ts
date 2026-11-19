import { UserCheck } from 'lucide-react';
import { Role } from '@multispeciality-hms/contracts';
import { NavItem } from '../../types/navigation';

export const patientNavItems: NavItem[] = [
  {
    label: 'Patient Portal',
    path: '/patient-portal',
    icon: UserCheck,
    roles: [Role.SUPER_ADMIN, Role.PATIENT],
  },
];
