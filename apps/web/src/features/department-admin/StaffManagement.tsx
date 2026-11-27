import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  Users,
  Search,
  Plus,
  Edit,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Filter,
} from 'lucide-react';
import { Role } from '@multispeciality-hms/contracts';

export const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeCode: '',
    designation: 'Staff Nurse',
    role: Role.NURSE,
    employmentType: 'FULL_TIME',
    shift: 'DAY',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getStaff({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      if (res.data) setStaff(res.data);
    } catch (err: any) {
      console.error('Failed to load staff:', err);
      setError(err.message || 'Failed to load department staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [search, statusFilter]);

  const handleToggleStatus = async (employee: any) => {
    try {
      await apiClient.departmentAdmin.toggleStaffStatus(employee.id);
      setSuccess(`Employee ${employee.employeeCode} status updated.`);
      await loadStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle employee status');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await apiClient.departmentAdmin.addStaff(formData);
      setSuccess('Staff member added to department successfully.');
      setIsAddOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        employeeCode: '',
        designation: 'Staff Nurse',
        role: Role.NURSE,
        employmentType: 'FULL_TIME',
        shift: 'DAY',
      });
      await loadStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to add staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      setSaving(true);
      setError('');
      await apiClient.departmentAdmin.updateStaff(selectedEmployee.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        designation: formData.designation,
        employmentType: formData.employmentType,
      });
      setSuccess('Staff record updated successfully.');
      setIsEditOpen(false);
      await loadStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to update staff member');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (emp: any) => {
    setSelectedEmployee(emp);
    setFormData({
      firstName: emp.user?.firstName || '',
      lastName: emp.user?.lastName || '',
      email: emp.user?.email || '',
      phone: emp.user?.phone || '',
      employeeCode: emp.employeeCode || '',
      designation: emp.designation || '',
      role: Role.NURSE,
      employmentType: emp.employmentType || 'FULL_TIME',
      shift: emp.nursingProfile?.shift || 'DAY',
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#00897B]" />
            Department Staff & Nursing Personnel
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department employees, designated responsibilities, shifts, and operational statuses.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-[#1565C0] hover:bg-[#00897B] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-teal-900/20"
        >
          <Plus className="w-4 h-4" />
          Add Department Staff
        </button>
      </div>

      {success && (
        <div className="p-3.5 bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-[#16A34A] hover:text-emerald-900 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-[#FEE2E2] border border-[#FECACA] text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626]" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search staff by name, code, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#00897B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#00897B] font-medium text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Staff</option>
            <option value="INACTIVE">Inactive / Suspended</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      {loading ? (
        <LoadingState message="Loading department staff..." />
      ) : staff.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-bold">Employee</th>
                  <th className="py-3.5 px-4 font-bold">Code</th>
                  <th className="py-3.5 px-4 font-bold">Designation</th>
                  <th className="py-3.5 px-4 font-bold">Employment</th>
                  <th className="py-3.5 px-4 font-bold">Contact</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((emp) => {
                  const user = emp.user;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#E0F2F1] text-[#183153] font-bold flex items-center justify-center text-xs">
                            {user?.firstName?.[0] || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-[11px] text-slate-400">{user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {emp.employeeCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {emp.designation}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {emp.employmentType?.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {user?.phone || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(emp)}
                            className="p-1.5 text-slate-400 hover:text-[#00897B] hover:bg-[#E0F2F1] rounded-lg transition-colors"
                            title={emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          >
                            {emp.status === 'ACTIVE' ? <ToggleRight className="w-4 h-4 text-[#16A34A]" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                          </button>
                          <button
                            onClick={() => openEdit(emp)}
                            className="p-1.5 text-slate-400 hover:text-[#00897B] hover:bg-[#E0F2F1] rounded-lg transition-colors"
                            title="Edit Employee"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No department staff found. Click "Add Department Staff" to create an employee record.
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Department Staff"
        subtitle="Provision department nursing or administrative staff."
        maxWidth="lg"
      >
        <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role Type</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value={Role.NURSE}>Nurse</option>
                <option value={Role.HEAD_NURSE}>Head Nurse</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Shift</label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="DAY">Day Shift (07:00 - 15:00)</option>
                <option value="NIGHT">Night Shift (21:00 - 07:00)</option>
                <option value="ROTATING">Rotating</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#1565C0] hover:bg-[#00897B] text-white rounded-xl font-semibold shadow-md shadow-teal-900/20 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit ${selectedEmployee?.employeeCode}`}
        subtitle="Update permitted staff details and assignments."
        maxWidth="lg"
      >
        <form onSubmit={handleEditStaff} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
            <select
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#1565C0] hover:bg-[#00897B] text-white rounded-xl font-semibold shadow-md shadow-teal-900/20 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
