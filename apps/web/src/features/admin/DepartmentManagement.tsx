import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import {
  Building2,
  Plus,
  Search,
  UserCheck,
  Shield,
  Edit2,
  Power,
  Users,
  BedDouble,
  CheckCircle2,
  AlertCircle,
  Archive,
} from 'lucide-react';

export const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignAdminModalOpen, setAssignAdminModalOpen] = useState(false);
  const [assignHodModalOpen, setAssignHodModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptRes, userRes] = await Promise.all([
        apiClient.hospitalAdmin.getDepartments(),
        apiClient.hospitalAdmin.getStaff(),
      ]);
      if (deptRes.data) setDepartments(deptRes.data);
      if (userRes.data) setStaffUsers(userRes.data);
    } catch (err: any) {
      console.error('Failed to load departments:', err);
      setErrorMessage(err.message || 'Failed to load department records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.createDepartment({
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description,
      });
      setSuccessMessage('Department created successfully.');
      setCreateModalOpen(false);
      setFormData({ name: '', code: '', description: '' });
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.updateDepartment(selectedDept.id, {
        name: formData.name,
        description: formData.description,
      });
      setSuccessMessage('Department updated successfully.');
      setEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignDepartmentAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !selectedUserId) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.assignDepartmentAdmin(selectedDept.id, selectedUserId);
      setSuccessMessage('Department Administrator assigned successfully.');
      setAssignAdminModalOpen(false);
      setSelectedUserId('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to assign Department Administrator');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignHod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.assignHod(selectedDept.id, selectedDoctorId || null);
      setSuccessMessage('Head of Department (HOD) updated successfully.');
      setAssignHodModalOpen(false);
      setSelectedDoctorId('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to assign HOD');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveDepartment = async (dept: any) => {
    if (!window.confirm(`Are you sure you want to archive department "${dept.name}"? This requires no active inpatients or assigned doctors.`)) {
      return;
    }
    try {
      setLoading(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.archiveDepartment(dept.id);
      setSuccessMessage(`Department "${dept.name}" archived successfully.`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to archive department');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (dept: any) => {
    try {
      await apiClient.hospitalAdmin.toggleDepartmentStatus(dept.id);
      setSuccessMessage(`Department "${dept.name}" status toggled.`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle status');
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && dept.isActive) ||
      (statusFilter === 'INACTIVE' && !dept.isActive);
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingState message="Loading hospital departments & administrative directory..." />;

  return (
    <div className="space-y-6 pb-12">
      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            {successMessage}
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-[#16A34A] hover:text-emerald-900">×</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 bg-[#FEE2E2] border border-[#FECACA] text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            {errorMessage}
          </div>
          <button onClick={() => setErrorMessage('')} className="text-[#DC2626] hover:text-rose-900">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#E0F2F1] text-[#00897B] rounded-xl border border-[#B2DFDB]">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Department Management</h1>
              <p className="text-xs text-slate-500">
                Organize clinical branches, assign HODs, and designate unique Department Admins
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setFormData({ name: '', code: '', description: '' });
            setErrorMessage('');
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Department
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search departments by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Departments</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Department Cards Grid */}
      {filteredDepartments.length === 0 ? (
        <EmptyState
          title="No departments found"
          description="Try modifying your search or click 'Create Department' to add a clinical unit."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepartments.map((dept) => {
            const adminAssignment = dept.userRoleScopes?.find((ur: any) => ur.user);
            const assignedAdmin = adminAssignment?.user;
            const doctorCount = dept.doctors?.length || 0;
            const wardCount = dept.wards?.length || 0;

            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                        {dept.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{dept.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {dept.description || 'No description provided.'}
                      </p>
                    </div>
                    <StatusBadge status={dept.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </div>

                  {/* Administrative Coverage Section */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                    {/* Department Admin */}
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#00897B] shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Department Admin</p>
                          <p className="font-semibold text-slate-800">
                            {assignedAdmin ? `${assignedAdmin.firstName} ${assignedAdmin.lastName}` : 'Unassigned'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDept(dept);
                          setSelectedUserId(assignedAdmin?.id || '');
                          setErrorMessage('');
                          setAssignAdminModalOpen(true);
                        }}
                        className="text-[11px] font-semibold text-[#00897B] hover:text-[#183153] underline"
                      >
                        {assignedAdmin ? 'Replace' : 'Assign'}
                      </button>
                    </div>

                    {/* Head of Department (HOD) */}
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#1565C0] shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Head of Department (HOD)</p>
                          <p className="font-semibold text-slate-800">
                            {dept.headOfDepartmentId
                              ? dept.doctors?.find((d: any) => d.id === dept.headOfDepartmentId)?.employee?.user
                                  ? `${dept.doctors.find((d: any) => d.id === dept.headOfDepartmentId).employee.user.firstName} ${dept.doctors.find((d: any) => d.id === dept.headOfDepartmentId).employee.user.lastName}`
                                  : 'Dr. Assigned'
                              : 'None Designated'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDept(dept);
                          setSelectedDoctorId(dept.headOfDepartmentId || '');
                          setErrorMessage('');
                          setAssignHodModalOpen(true);
                        }}
                        className="text-[11px] font-semibold text-[#1565C0] hover:text-sky-800 underline"
                      >
                        Configure
                      </button>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Doctors</span>
                        <span className="font-bold text-slate-800">{doctorCount}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Wards Attached</span>
                        <span className="font-bold text-slate-800">{wardCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setSelectedDept(dept);
                      setFormData({
                        name: dept.name,
                        code: dept.code,
                        description: dept.description || '',
                      });
                      setErrorMessage('');
                      setEditModalOpen(true);
                    }}
                    className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>

                  <button
                    onClick={() => handleToggleStatus(dept)}
                    className={`flex items-center gap-1 font-semibold ${
                      dept.isActive ? 'text-amber-600 hover:text-amber-800' : 'text-[#16A34A] hover:text-[#16A34A]'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {dept.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => handleArchiveDepartment(dept)}
                    className="flex items-center gap-1 font-semibold text-[#DC2626] hover:text-rose-800"
                    title="Archive Department"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE DEPARTMENT MODAL */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Clinical Department">
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Cardiology, Orthopaedics, Neurology"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. CARD, ORTHO, NEURO"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Department clinical scope, diagnostic capabilities, and specialized units..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1565C0] hover:bg-[#0D47A1] rounded-lg shadow-sm"
            >
              {submitting ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT DEPARTMENT MODAL */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Department: ${selectedDept?.name}`}>
        <form onSubmit={handleUpdateDepartment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1565C0] hover:bg-[#0D47A1] rounded-lg shadow-sm"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN / REPLACE DEPARTMENT ADMIN MODAL */}
      <Modal
        isOpen={assignAdminModalOpen}
        onClose={() => setAssignAdminModalOpen(false)}
        title={`Designate Department Admin: ${selectedDept?.name}`}
      >
        <form onSubmit={handleAssignDepartmentAdmin} className="space-y-4">
          <div className="p-3 bg-[#E0F2F1] border border-[#B2DFDB] rounded-xl text-xs text-[#183153]">
            <span className="font-bold">Hospital Policy Enforcement:</span>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
              <li>One department must have exactly ONE active Department Admin.</li>
              <li>A user account can be assigned to manage only one department.</li>
              <li>Assigning a new admin automatically replaces any prior department admin.</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select User to Assign as Department Administrator *
            </label>
            <select
              required
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Choose Staff User --</option>
              {staffUsers
                .filter((u) => u.isActive && u.role !== 'SUPER_ADMIN')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email}) — {u.role}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssignAdminModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedUserId}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1565C0] hover:bg-[#0D47A1] rounded-lg shadow-sm"
            >
              {submitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN HOD MODAL */}
      <Modal
        isOpen={assignHodModalOpen}
        onClose={() => setAssignHodModalOpen(false)}
        title={`Configure HOD: ${selectedDept?.name}`}
      >
        <form onSubmit={handleAssignHod} className="space-y-4">
          <p className="text-xs text-slate-500">
            Designate a senior attending consultant as the Head of Department for clinical oversight.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- None (Clear HOD) --</option>
              {selectedDept?.doctors?.map((doc: any) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.employee?.user?.firstName} {doc.employee?.user?.lastName} ({doc.designation} — {doc.specialization})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssignHodModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1565C0] hover:bg-[#0D47A1] rounded-lg shadow-sm"
            >
              {submitting ? 'Saving...' : 'Update HOD'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
