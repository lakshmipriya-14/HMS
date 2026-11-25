import React, { useState } from 'react';
import { ROLE_PERMISSIONS_MATRIX, Role } from '@multispeciality-hms/contracts';
import { ShieldCheck, Search, Shield, Key } from 'lucide-react';

export const RolePermissionsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>(Role.HOSPITAL_ADMIN);

  const rolesList = Object.keys(ROLE_PERMISSIONS_MATRIX) as Role[];

  const permissions = (ROLE_PERMISSIONS_MATRIX as any)[selectedRole] || [];

  const filteredPermissions = permissions.filter((p: string) =>
    p.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Role & Permission Policy Matrix</h1>
            <p className="text-xs text-slate-500">
              Contract-level RBAC definitions, operational scoping rules, and resource access authorities
            </p>
          </div>
        </div>
      </div>

      {/* Scoping Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
            <Shield className="w-4 h-4 text-purple-600" />
            Super Admin Authority
          </div>
          <p className="text-slate-500">
            Organization-wide scope without branch boundary. Full authority to manage hospital branches, provision
            Hospital Admins, and oversee system audit logs.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
            <Shield className="w-4 h-4 text-teal-600" />
            Hospital Admin Authority
          </div>
          <p className="text-slate-500">
            Operating branch scope (<code className="font-mono text-teal-700">branch:{"{branchId}"}</code>).
            Governs departments, rosters doctors, hires staff, manages wards/beds, and inspects financial ledgers.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
            <Shield className="w-4 h-4 text-sky-600" />
            Department Admin Authority
          </div>
          <p className="text-slate-500">
            Department-level scope (<code className="font-mono text-sky-700">branch:{"{b}"}:dept:{"{d}"}</code>).
            Exactly 1 active admin per department. Governs intra-department clinical rosters and attendance.
          </p>
        </div>
      </div>

      {/* Role Picker & Permission Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Inspect Role Authorities</h3>
            <p className="text-xs text-slate-500 mt-0.5">Select a role to review granted API and UI permissions</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Roles Pill Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {rolesList.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedRole === role
                  ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {role.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Permissions Grid */}
        <div>
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-700">
              Granted Permissions for <span className="text-teal-700 font-mono">{selectedRole}</span>:
            </span>
            <span className="text-slate-400 font-medium">{filteredPermissions.length} permissions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filteredPermissions.map((perm: string) => {
              const [res, action] = perm.split(':');
              return (
                <div
                  key={perm}
                  className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center gap-2 text-xs"
                >
                  <Key className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 font-mono">{perm}</span>
                    <span className="text-[10px] text-slate-400 block">
                      {action} on {res}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
