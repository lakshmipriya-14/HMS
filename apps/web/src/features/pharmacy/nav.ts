import { Pill } from 'lucide-react';
import { Role } from '@multispeciality-hms/contracts';
import { NavItem } from '../../types/navigation';

export const pharmacyNavItems: NavItem[] = [
  {
    label: 'Pharmacy & Inventory',
    path: '/pharmacy',
    icon: Pill,
    roles: [Role.SUPER_ADMIN, Role.PHARMACIST],
  },
];
