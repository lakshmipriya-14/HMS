import { Scan } from 'lucide-react';
import { Role } from '@multispeciality-hms/contracts';
import { NavItem } from '../../types/navigation';

export const radiologyNavItems: NavItem[] = [
  {
    label: 'Radiology & Imaging',
    path: '/radiology',
    icon: Scan,
    roles: [Role.SUPER_ADMIN, Role.RADIOLOGY_STAFF],
  },
];
