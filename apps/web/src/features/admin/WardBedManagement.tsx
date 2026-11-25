import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import {
  BedDouble,
  Plus,
  Building,
  Layers,
  Wrench,
  CheckCircle2,
  AlertCircle,
  DoorClosed,
  DollarSign,
  User,
  Trash2,
} from 'lucide-react';

export const WardBedManagement: React.FC = () => {
  const [wards, setWards] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedWard, setSelectedWard] = useState<any>(null);
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bedsLoading, setBedsLoading] = useState(false);

  // Modals
  const [addWardModalOpen, setAddWardModalOpen] = useState(false);
  const [addBedModalOpen, setAddBedModalOpen] = useState(false);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<any>(null);

  // Forms
  const [wardForm, setWardForm] = useState({
    name: '',
    code: '',
    departmentId: '',
    floorNumber: 1,
    genderAllowed: 'ANY',
  });

  const [bedForm, setBedForm] = useState({
    roomNumber: '101',
    bedNumber: 'A',
    type: 'STANDARD',
    dailyRate: 1000,
    status: 'AVAILABLE',
  });

  const [newBedStatus, setNewBedStatus] = useState('AVAILABLE');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadWards = async () => {
    try {
      setLoading(true);
      const [wRes, dRes] = await Promise.all([
        apiClient.hospitalAdmin.getWards(),
        apiClient.hospitalAdmin.getDepartments(),
      ]);
      if (wRes.data) {
        setWards(wRes.data);
        if (wRes.data.length > 0 && !selectedWard) {
          setSelectedWard(wRes.data[0]);
        }
      }
      if (dRes.data) setDepartments(dRes.data);
    } catch (err: any) {
      console.error('Failed to load wards:', err);
      setErrorMessage(err.message || 'Failed to load wards');
    } finally {
      setLoading(false);
    }
  };

  const loadBeds = async (wardId: string) => {
    try {
      setBedsLoading(true);
      const res = await apiClient.wards.getBeds(wardId);
      if (res.data) setBeds(res.data);
    } catch (err) {
      console.error('Failed to load beds:', err);
    } finally {
      setBedsLoading(false);
    }
  };

  useEffect(() => {
    loadWards();
  }, []);

  useEffect(() => {
    if (selectedWard) {
      loadBeds(selectedWard.id);
    }
  }, [selectedWard]);

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.createWard(wardForm);
      setSuccessMessage(`Ward "${wardForm.name}" created successfully.`);
      setAddWardModalOpen(false);
      setWardForm({
        name: '',
        code: '',
        departmentId: '',
        floorNumber: 1,
        genderAllowed: 'ANY',
      });
      await loadWards();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create ward');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWard) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.createBed(selectedWard.id, bedForm);
      setSuccessMessage(`Bed ${bedForm.bedNumber} added to room ${bedForm.roomNumber}.`);
      setAddBedModalOpen(false);
      await loadBeds(selectedWard.id);
      await loadWards();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBedStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.updateBedStatus(selectedBed.id, newBedStatus);
      setSuccessMessage(`Bed ${selectedBed.bedNumber} status updated to ${newBedStatus}.`);
      setUpdateStatusModalOpen(false);
      if (selectedWard) await loadBeds(selectedWard.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update bed status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBed = async (bed: any) => {
    if (bed.status === 'OCCUPIED') {
      setErrorMessage('Cannot delete an occupied bed. Discharge or transfer the patient first.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete Bed ${bed.roomNumber}-${bed.bedNumber}?`)) {
      return;
    }
    try {
      setBedsLoading(true);
      await apiClient.hospitalAdmin.deleteBed(bed.id);
      setSuccessMessage(`Bed ${bed.roomNumber}-${bed.bedNumber} deleted successfully.`);
      if (selectedWard) await loadBeds(selectedWard.id);
      await loadWards();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete bed');
    } finally {
      setBedsLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading hospital wards layout and bed census..." />;

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
          <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <BedDouble className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Wards, Rooms & Inpatient Bed Census</h1>
            <p className="text-xs text-slate-500">
              Interactive floor maps, bed turnover statuses, and inpatient occupancy monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setWardForm({
                name: '',
                code: '',
                departmentId: departments[0]?.id || '',
                floorNumber: 1,
                genderAllowed: 'ANY',
              });
              setErrorMessage('');
              setAddWardModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Ward
          </button>
        </div>
      </div>

      {/* Wards Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {wards.map((ward) => {
          const isSelected = selectedWard?.id === ward.id;
          const occPct = ward.totalBeds > 0 ? Math.round((ward.occupiedBeds / ward.totalBeds) * 100) : 0;
          return (
            <button
              key={ward.id}
              onClick={() => setSelectedWard(ward)}
              className={`px-4 py-3 rounded-2xl border text-left shrink-0 transition-all ${isSelected
                  ? 'bg-teal-700 text-white border-teal-800 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {ward.name}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${isSelected ? 'bg-teal-800 text-teal-200' : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  Floor {ward.floorNumber}
                </span>
              </div>
              <p className={`text-[11px] mt-1 ${isSelected ? 'text-teal-200' : 'text-slate-500'}`}>
                {ward.occupiedBeds} / {ward.totalBeds} beds ({occPct}%)
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Ward Details & Bed Grid */}
      {selectedWard && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{selectedWard.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                  {selectedWard.code}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700">
                  Gender: {selectedWard.genderAllowed}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Department: {selectedWard.department?.name || 'General Inpatient'} • Floor Level: {selectedWard.floorNumber}
              </p>
            </div>

            <button
              onClick={() => {
                setBedForm({
                  roomNumber: '101',
                  bedNumber: `B-${beds.length + 1}`,
                  type: 'STANDARD',
                  dailyRate: 1000,
                  status: 'AVAILABLE',
                });
                setErrorMessage('');
                setAddBedModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Bed to Ward
            </button>
          </div>

          {/* Bed Grid */}
          {bedsLoading ? (
            <LoadingState message="Updating bed status grid..." />
          ) : beds.length === 0 ? (
            <EmptyState
              title="No beds configured in this ward"
              description="Click 'Add Bed to Ward' above to provision hospital beds."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {beds.map((bed) => {
                const isOccupied = bed.status === 'OCCUPIED';
                const isAvailable = bed.status === 'AVAILABLE';
                const isMaintenance = bed.status === 'MAINTENANCE';
                const isCleaning = bed.status === 'CLEANING' || bed.status === 'HOUSEKEEPING';

                let borderStyle = 'border-slate-200 hover:border-slate-300';
                let bgStyle = 'bg-slate-50/50';
                if (isAvailable) {
                  borderStyle = 'border-emerald-200 hover:border-emerald-400';
                  bgStyle = 'bg-emerald-50/30';
                } else if (isOccupied) {
                  borderStyle = 'border-sky-200 hover:border-sky-400';
                  bgStyle = 'bg-sky-50/40';
                } else if (isMaintenance) {
                  borderStyle = 'border-rose-200 hover:border-rose-400';
                  bgStyle = 'bg-rose-50/30';
                } else if (isCleaning) {
                  borderStyle = 'border-amber-200 hover:border-amber-400';
                  bgStyle = 'bg-amber-50/30';
                }

                return (
                  <div
                    key={bed.id}
                    className={`p-3 rounded-xl border ${borderStyle} ${bgStyle} flex flex-col justify-between transition-all`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-500 font-mono">
                          Room {bed.roomNumber}
                        </span>
                        <StatusBadge status={bed.status} />
                      </div>

                      <div className="mt-2 text-center py-2">
                        <BedDouble
                          className={`w-7 h-7 mx-auto ${isOccupied
                              ? 'text-sky-600'
                              : isAvailable
                                ? 'text-emerald-600'
                                : isMaintenance
                                  ? 'text-rose-600'
                                  : 'text-amber-600'
                            }`}
                        />
                        <h4 className="font-bold text-sm text-slate-800 mt-1">{bed.bedNumber}</h4>
                        <span className="text-[10px] text-slate-500 font-medium uppercase">{bed.type}</span>
                      </div>

                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                        <span>Daily Rate:</span>
                        <span className="font-bold text-slate-800">₹{Number(bed.dailyRate)}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedBed(bed);
                          setNewBedStatus(bed.status);
                          setUpdateStatusModalOpen(true);
                        }}
                        className="flex-1 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-[11px] transition-all shadow-2xs"
                      >
                        Status
                      </button>
                      {!isOccupied && (
                        <button
                          onClick={() => handleDeleteBed(bed)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Bed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE WARD MODAL */}
      <Modal isOpen={addWardModalOpen} onClose={() => setAddWardModalOpen(false)} title="Create New Inpatient Ward">
        <form onSubmit={handleCreateWard} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Intensive Care Unit, Pediatric Ward"
                value={wardForm.name}
                onChange={(e) => setWardForm({ ...wardForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. ICU-A, PED-W"
                value={wardForm.code}
                onChange={(e) => setWardForm({ ...wardForm, code: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={wardForm.departmentId}
                onChange={(e) => setWardForm({ ...wardForm, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">General</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Number *</label>
              <input
                type="number"
                min={0}
                max={20}
                required
                value={wardForm.floorNumber}
                onChange={(e) => setWardForm({ ...wardForm, floorNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender Allowed</label>
              <select
                value={wardForm.genderAllowed}
                onChange={(e) => setWardForm({ ...wardForm, genderAllowed: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ANY">Any / Mixed</option>
                <option value="MALE">Male Only</option>
                <option value="FEMALE">Female Only</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddWardModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Creating...' : 'Create Ward'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD BED MODAL */}
      <Modal isOpen={addBedModalOpen} onClose={() => setAddBedModalOpen(false)} title={`Add Bed to ${selectedWard?.name}`}>
        <form onSubmit={handleCreateBed} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number *</label>
              <input
                type="text"
                required
                value={bedForm.roomNumber}
                onChange={(e) => setBedForm({ ...bedForm, roomNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bed Number *</label>
              <input
                type="text"
                required
                value={bedForm.bedNumber}
                onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bed Type</label>
              <select
                value={bedForm.type}
                onChange={(e) => setBedForm({ ...bedForm, type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="STANDARD">Standard</option>
                <option value="SEMI_PRIVATE">Semi-Private</option>
                <option value="PRIVATE">Private Room</option>
                <option value="DELUXE">Deluxe Suite</option>
                <option value="ICU">Intensive Care Unit (ICU)</option>
                <option value="CCU">Critical Care Unit (CCU)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Rate (₹)</label>
              <input
                type="number"
                min={0}
                value={bedForm.dailyRate}
                onChange={(e) => setBedForm({ ...bedForm, dailyRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddBedModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Adding...' : 'Add Bed'}
            </button>
          </div>
        </form>
      </Modal>

      {/* UPDATE BED STATUS MODAL */}
      <Modal
        isOpen={updateStatusModalOpen}
        onClose={() => setUpdateStatusModalOpen(false)}
        title={`Bed Status: ${selectedBed?.bedNumber} (Room ${selectedBed?.roomNumber})`}
      >
        <form onSubmit={handleUpdateBedStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Change Operational Status</label>
            <select
              value={newBedStatus}
              onChange={(e) => setNewBedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="AVAILABLE">Available for Admission</option>
              <option value="CLEANING">Turnover / Housekeeping Cleaning</option>
              <option value="MAINTENANCE">Under Engineering Maintenance</option>
              <option value="RESERVED">Reserved</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setUpdateStatusModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Updating...' : 'Save Bed Status'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
