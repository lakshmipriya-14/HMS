import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '@multispeciality-hms/contracts';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  HeartPulse,
  UserPlus,
  FlaskConical,
  Pill,
  Scan,
  CreditCard,
  BedDouble,
  Ambulance,
  UserCheck,
  ShieldAlert,
  Building2,
  CalendarCheck,
  ClipboardList,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  // Super Admin / Hospital Admin
  {
    label: 'Hospital Admin',
    path: '/admin',
    icon: LayoutDashboard,
    roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.DEPARTMENT_ADMIN],
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: Users,
    roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN],
  },
  {
    label: 'Audit Trail',
    path: '/admin/audit',
    icon: ShieldAlert,
    roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN],
  },

  // Reception
  {
    label: 'Reception & Registration',
    path: '/reception',
    icon: UserPlus,
    roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.RECEPTIONIST],
  },

  // Doctor
  {
    label: 'Doctor Workspace',
    path: '/doctor',
    icon: Stethoscope,
    roles: [Role.SUPER_ADMIN, Role.DOCTOR],
  },

  // Nursing
  {
    label: 'Nursing Inpatient Care',
    path: '/nursing',
    icon: HeartPulse,
    roles: [Role.SUPER_ADMIN, Role.NURSE, Role.HEAD_NURSE],
  },

  // Laboratory
  {
    label: 'Laboratory Diagnostics',
    path: '/laboratory',
    icon: FlaskConical,
    roles: [Role.SUPER_ADMIN, Role.LAB_TECHNICIAN],
  },

  // Pharmacy
  {
    label: 'Pharmacy Dispensary',
    path: '/pharmacy',
    icon: Pill,
    roles: [Role.SUPER_ADMIN, Role.PHARMACIST],
  },

  // Radiology
  {
    label: 'Radiology & Imaging',
    path: '/radiology',
    icon: Scan,
    roles: [Role.SUPER_ADMIN, Role.RADIOLOGY_STAFF],
  },

  // Wards & Beds
  {
    label: 'Ward & Bed Manager',
    path: '/wards',
    icon: BedDouble,
    roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.WARD_MANAGER, Role.HEAD_NURSE],
  },

  // Billing & Insurance
  {
    label: 'Billing & Cashier',
    path: '/billing',
    icon: CreditCard,
    roles: [Role.SUPER_ADMIN, Role.BILLING_STAFF, Role.INSURANCE_STAFF],
  },

  // Ambulance
  {
    label: 'Emergency & Ambulance',
    path: '/ambulance',
    icon: Ambulance,
    roles: [Role.SUPER_ADMIN, Role.AMBULANCE_COORDINATOR, Role.AMBULANCE_DRIVER],
  },

  // Patient Self Service
  {
    label: 'Patient Portal',
    path: '/patient-portal',
    icon: UserCheck,
    roles: [Role.SUPER_ADMIN, Role.PATIENT],
  },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const filteredNav = NAV_ITEMS.filter((item) => {
    if (!user) return false;
    if (user.role === Role.SUPER_ADMIN) return true;
    return item.roles.includes(user.role);
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-900/30">
          <HeartPulse className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight tracking-tight">
            Aalayam
          </h1>
          <p className="text-[10px] text-teal-400 font-medium tracking-wider uppercase">
            Multispeciality Hospital
          </p>
          <p className="text-[9px] text-slate-500 font-tamil">
            ஆலயம் மருத்துவமனை
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Clinical & Ops Modules
        </p>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Role Badge Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-teal-800/50 border border-teal-600/40 flex items-center justify-center text-xs font-bold text-teal-300">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
            </p>
            <p className="text-[10px] text-teal-400 truncate font-mono">
              {user?.role?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
