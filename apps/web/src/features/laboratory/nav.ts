import { FlaskConical } from 'lucide-react';
import { Role } from '@multispeciality-hms/contracts';
import { NavItem } from '../../types/navigation';

export const laboratoryNavItems: NavItem[] = [
  {
    label: 'Laboratory Services',
    path: '/laboratory',
    icon: FlaskConical,
    roles: [Role.SUPER_ADMIN, Role.LAB_TECHNICIAN],
  },
];
