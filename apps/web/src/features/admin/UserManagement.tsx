import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { exportToCSV, exportToPrintablePDF } from '../../utils/exportReport';
import { Search, Download, FileSpreadsheet, FileText } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [includeSuperAdmin, setIncludeSuperAdmin] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiClient.admin.getUsers({
          search: searchTerm || undefined,
          role: selectedRole || undefined,
        });
        if (res.data) setUsers(res.data);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [searchTerm, selectedRole]);

  // Exclude SUPER_ADMIN from view unless explicitly requested
  const visibleUsers = users.filter((u) => includeSuperAdmin || u.role !== 'SUPER_ADMIN');

  const handleExportCSV = () => {
    exportToCSV({
      title: 'Staff & User Account Directory',
      headers: ['User Name', 'Email', 'Role', 'Designation', 'Department', 'Phone', 'Last Login'],
      rows: visibleUsers.map((u) => [
        `${u.firstName} ${u.lastName}`,
        u.email,
        u.role,
        u.employee?.designation || 'Staff',
        u.employee?.department?.name || 'Central',
        u.phone || 'N/A',
        u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-IN') : 'Never',
      ]),
      fileName: 'staff_user_directory',
      filterSummary: selectedRole ? `Role: ${selectedRole}` : 'All Staff (Excl. Super Admin)',
    });
  };

  const handleExportPDF = () => {
    exportToPrintablePDF({
      title: 'Staff & User Account Directory Report',
      headers: ['User Name', 'Email', 'Role', 'Designation', 'Department', 'Phone', 'Last Login'],
      rows: visibleUsers.map((u) => [
        `${u.firstName} ${u.lastName}`,
        u.email,
        u.role,
        u.employee?.designation || 'Staff',
        u.employee?.department?.name || 'Central',
        u.phone || 'N/A',
        u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-IN') : 'Never',
      ]),
      filterSummary: selectedRole ? `Role: ${selectedRole}` : 'All Staff (Excl. Super Admin)',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Staff & User Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Global RBAC accounts, credential status, and departmental assignments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Aligned Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, or employee code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border border-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white min-w-[180px]"
          >
            <option value="">All Staff Roles (Excl. Super Admin)</option>
            <option value="HOSPITAL_ADMIN">Hospital Admin</option>
            <option value="DOCTOR">Doctor</option>
            <option value="NURSE">Staff Nurse</option>
            <option value="HEAD_NURSE">Head Nurse</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="LAB_TECHNICIAN">Lab Technician</option>
            <option value="PHARMACIST">Pharmacist</option>
            <option value="RADIOLOGY_STAFF">Radiology</option>
            <option value="BILLING_STAFF">Billing Staff</option>
            <option value="INSURANCE_STAFF">Insurance Staff</option>
            <option value="WARD_MANAGER">Ward Manager</option>
            <option value="AMBULANCE_DRIVER">Ambulance Driver</option>
            <option value="PATIENT">Patient Account</option>
          </select>

          <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer border border-slate-200 rounded-lg py-2 px-3 bg-slate-50 hover:bg-slate-100">
            <input
              type="checkbox"
              checked={includeSuperAdmin}
              onChange={(e) => setIncludeSuperAdmin(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
            />
            <span>Include Super Admin</span>
          </label>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingState message="Fetching system users..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department / Designation</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{u.employee?.designation || 'Hospital Staff'}</div>
                        <div className="text-[11px] text-slate-400">{u.employee?.department?.name || 'Central'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {u.phone || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-IN') : 'Never logged in'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
