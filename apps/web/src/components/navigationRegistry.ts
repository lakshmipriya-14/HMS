import { adminNavItems } from '../features/admin/nav';
import { departmentAdminNavItems } from '../features/department-admin/nav';
import { doctorNavItems } from '../features/doctor/nav';
import { nursingNavItems } from '../features/nursing/nav';
import { receptionNavItems } from '../features/reception/nav';
import { laboratoryNavItems } from '../features/laboratory/nav';
import { pharmacyNavItems } from '../features/pharmacy/nav';
import { radiologyNavItems } from '../features/radiology/nav';
import { billingNavItems } from '../features/billing/nav';
import { wardNavItems } from '../features/wards/nav';
import { ambulanceNavItems } from '../features/ambulance/nav';
import { patientNavItems } from '../features/patient/nav';
import { NavItem } from '../types/navigation';

/**
 * Aggregates role-based navigation menus across all 10 independent feature modules.
 * When a developer modifies navigation for their module (e.g. Doctor), they only
 * update their feature folder's `nav.ts` file without causing merge conflicts.
 */
export const ALL_NAV_ITEMS: NavItem[] = [
  ...adminNavItems,
  ...departmentAdminNavItems,
  ...receptionNavItems,
  ...doctorNavItems,
  ...nursingNavItems,
  ...laboratoryNavItems,
  ...pharmacyNavItems,
  ...radiologyNavItems,
  ...billingNavItems,
  ...wardNavItems,
  ...ambulanceNavItems,
  ...patientNavItems,
];
