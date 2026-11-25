import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { exportToCSV, exportToPrintablePDF } from '../../utils/exportReport';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Edit2,
  Power,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { Role } from '@multispeciality-hms/contracts';

export const StaffManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Forms
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: Role.NURSE,
    departmentId: '',
    designation: '',
    employeeCode: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, dRes] = await Promise.all([
        apiClient.hospitalAdmin.getStaff({
          role: roleFilter || undefined,
          search: searchTerm || undefined,
        }),
        apiClient.hospitalAdmin.getDepartments(),
      ]);
      if (uRes.data) setUsers(uRes.data);
      if (dRes.data) setDepartments(dRes.data);
    } catch (err: any) {
      console.error('Failed to load staff:', err);
      setErrorMessage(err.message || 'Failed to load staff directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, searchTerm]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.createStaff(formData);
      setSuccessMessage(`Staff member "${formData.firstName} ${formData.lastName}" created successfully.`);
      setAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.updateStaff(selectedUser.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        designation: formData.designation,
        departmentId: formData.departmentId,
      });
      setSuccessMessage('Staff profile updated.');
      setEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.resetStaffPassword(selectedUser.id, newPassword || undefined);
      setSuccessMessage(`Password reset for ${selectedUser.firstName} ${selectedUser.lastName}.`);
      setResetModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await apiClient.hospitalAdmin.toggleStaffStatus(user.id);
      setSuccessMessage(`Account status for ${user.firstName} ${user.lastName} toggled.`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle status');
    }
  };

  // Exclude SUPER_ADMIN from normal hospital staff view
  const visibleStaff = users.filter((u) => {
    if (u.role === Role.SUPER_ADMIN) return false;
    if (departmentFilter && u.department?.id !== departmentFilter && u.employee?.department?.id !== departmentFilter) {
      return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    exportToCSV({
      title: 'Hospital Staff & Employee Directory',
      headers: ['Employee Name', 'Role', 'Employee Code', 'Designation', 'Department', 'Email', 'Phone', 'Status'],
      rows: visibleStaff.map((u) => [
        `${u.firstName} ${u.lastName}`,
        u.role,
        u.employee?.employeeCode || 'N/A',
        u.employee?.designation || 'Staff',
        u.department?.name || u.employee?.department?.name || 'General',
        u.email,
        u.phone || 'N/A',
        u.isActive ? 'Active' : 'Inactive',
      ]),
      fileName: 'hospital_staff_directory',
    });
  };

  if (loading) return <LoadingState message="Loading hospital employee and HR directory..." />;

  const STAFF_ROLES = [
    { value: Role.NURSE, label: 'Staff Nurse' },
    { value: Role.HEAD_NURSE, label: 'Head Nurse' },
    { value: Role.RECEPTIONIST, label: 'Receptionist' },
    { value: Role.PHARMACIST, label: 'Pharmacist' },
    { value: Role.LAB_TECHNICIAN, label: 'Lab Technician' },
    { value: Role.RADIOLOGY_STAFF, label: 'Radiology Technician' },
    { value: Role.BILLING_STAFF, label: 'Billing Staff' },
    { value: Role.INSURANCE_STAFF, label: 'Insurance Coordinator' },
    { value: Role.WARD_MANAGER, label: 'Ward Manager' },
    { value: Role.AMBULANCE_COORDINATOR, label: 'Ambulance Coordinator' },
    { value: Role.AMBULANCE_DRIVER, label: 'Ambulance Driver' },
    { value: Role.DEPARTMENT_ADMIN, label: 'Department Administrator' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Messages */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMessage}
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900">×</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            {errorMessage}
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-900">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            <Users className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Hospital Staff & Employee Directory</h1>
            <p className="text-xs text-slate-500">
              Manage non-physician medical staff, administration, technical operators, and HR profiles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => {
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                role: Role.NURSE,
                departmentId: departments[0]?.id || '',
                designation: 'Staff Nurse',
                employeeCode: '',
              });
              setErrorMessage('');
              setAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, employee code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Staff Roles</option>
          {STAFF_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role & Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No employees matching the current filters.
                  </td>
                </tr>
              ) : (
                visibleStaff.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">
                        {u.firstName} {u.lastName}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {u.employee?.employeeCode || 'EMP-XXXX'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 block">
                        {u.employee?.designation || u.role?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-teal-700 font-bold uppercase">{u.role}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {u.department?.name || u.employee?.department?.name || 'Hospital General'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{u.email}</div>
                      <div className="text-[11px] text-slate-400">{u.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={u.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setFormData({
                              firstName: u.firstName,
                              lastName: u.lastName,
                              email: u.email,
                              phone: u.phone || '',
                              role: u.role,
                              departmentId: u.department?.id || u.employee?.department?.id || '',
                              designation: u.employee?.designation || '',
                              employeeCode: u.employee?.employeeCode || '',
                            });
                            setEditModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                          title="Edit details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setNewPassword('');
                            setResetModalOpen(true);
                          }}
                          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-all"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition-all ${
                            u.isActive
                              ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-50'
                              : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                          }`}
                          title={u.isActive ? 'Deactivate account' : 'Activate account'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD STAFF MODAL */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Register New Hospital Employee">
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role *</label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Central / Hospital Wide --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Designation</label>
              <input
                type="text"
                placeholder="e.g. Senior ICU Nurse, Lead Pharmacist"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Code (Optional)</label>
              <input
                type="text"
                placeholder="Auto-generated if left blank"
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            Initial temporary password will be set to: <code className="font-bold text-slate-800">UyirinaiTeamDemo!24</code>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Creating...' : 'Register Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT STAFF MODAL */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Staff: ${selectedUser?.firstName} ${selectedUser?.lastName}`}>
        <form onSubmit={handleUpdateStaff} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department (Transfer)</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Central / Hospital Wide --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title={`Reset Password: ${selectedUser?.firstName} ${selectedUser?.lastName}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-slate-500">
            Set a new temporary password or leave blank to reset to default{' '}
            <code className="font-bold text-slate-800">UyirinaiTeamDemo!24</code>.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (Optional)</label>
            <input
              type="password"
              placeholder="Leave blank for UyirinaiTeamDemo!24"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Resetting...' : 'Confirm Reset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
