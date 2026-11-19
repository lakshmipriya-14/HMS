import { CreditCard } from 'lucide-react';
import { Role } from '@multispeciality-hms/contracts';
import { NavItem } from '../../types/navigation';

export const billingNavItems: NavItem[] = [
  {
    label: 'Billing & Cashier',
    path: '/billing',
    icon: CreditCard,
    roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BILLING_STAFF, Role.INSURANCE_STAFF],
  },
];
