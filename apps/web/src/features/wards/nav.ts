import { BedDouble } from 'lucide-react';
import { Role } from '@multispeciality-hms/contracts';
import { NavItem } from '../../types/navigation';

export const wardNavItems: NavItem[] = [
  {
    label: 'Ward & Bed Management',
    path: '/wards',
    icon: BedDouble,
    roles: [Role.SUPER_ADMIN, Role.WARD_MANAGER, Role.HEAD_NURSE],
  },
];
