import { Stethoscope } from 'lucide-react';
import { Role } from '@multispeciality-hms/contracts';
import { NavItem } from '../../types/navigation';

export const doctorNavItems: NavItem[] = [
  {
    label: 'Doctor Workspace',
    path: '/doctor',
    icon: Stethoscope,
    roles: [Role.SUPER_ADMIN, Role.DOCTOR],
  },
];
