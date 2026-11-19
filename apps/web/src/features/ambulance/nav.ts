import { Ambulance } from 'lucide-react';
import { Role } from '@multispeciality-hms/contracts';
import { NavItem } from '../../types/navigation';

export const ambulanceNavItems: NavItem[] = [
  {
    label: 'Ambulance Dispatch',
    path: '/ambulance',
    icon: Ambulance,
    roles: [Role.SUPER_ADMIN, Role.AMBULANCE_COORDINATOR, Role.AMBULANCE_DRIVER],
  },
];
