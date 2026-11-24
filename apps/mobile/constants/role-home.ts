import type { Href } from 'expo-router';
import { Role } from '@multispeciality-hms/contracts';

export const roleHome: Record<Role, Href> = {
  SUPER_ADMIN: '/(super-admin)' as Href, HOSPITAL_ADMIN: '/(admin)', DEPARTMENT_ADMIN: '/(admin)',
  DOCTOR: '/(doctor)', NURSE: '/(nurse)', HEAD_NURSE: '/(nurse)',
  RECEPTIONIST: '/(reception)', PHARMACIST: '/(pharmacy)', LAB_TECHNICIAN: '/(lab)',
  RADIOLOGY_STAFF: '/(radiology)', BILLING_STAFF: '/(billing)', INSURANCE_STAFF: '/(billing)',
  WARD_MANAGER: '/(billing)', AMBULANCE_COORDINATOR: '/(ambulance)', AMBULANCE_DRIVER: '/(ambulance)',
  PATIENT: '/(patient)',
};

