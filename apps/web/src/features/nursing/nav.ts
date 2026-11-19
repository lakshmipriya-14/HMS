import { HeartPulse } from 'lucide-react';
import { Role } from '@multispeciality-hms/contracts';
import { NavItem } from '../../types/navigation';

export const nursingNavItems: NavItem[] = [
  {
    label: 'Nursing Inpatient Care',
    path: '/nursing',
    icon: HeartPulse,
    roles: [Role.SUPER_ADMIN, Role.HEAD_NURSE, Role.NURSE],
  },
];
