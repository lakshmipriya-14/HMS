import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import {
  Pill,
  Search,
  AlertTriangle,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Package,
} from 'lucide-react';

export const PharmacyOverview: React.FC = () => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [lowStockMeds, setLowStockMeds] = useState<any[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'LOW_STOCK' | 'QUEUE'>('INVENTORY');

  // Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [addMedModalOpen, setAddMedModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<any>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(50);
  const [adjustmentReason, setAdjustmentReason] = useState('Stock Replenishment');
  const [newMedForm, setNewMedForm] = useState({
    brandName: '',
    genericName: '',
    category: 'ANTIBIOTIC',
    strength: '500mg',
    dosageForm: 'TABLET',
    manufacturer: 'Aalayam Pharma',
    unitPrice: 15,
    reorderLevel: 20,
    initialStock: 100,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, lowRes, expRes, qRes] = await Promise.all([
        apiClient.pharmacy.getMedicines(searchTerm || undefined),
        apiClient.pharmacy.getLowStockAlerts(),
        apiClient.pharmacy.getExpiryAlerts(),
        apiClient.pharmacy.getDispenseQueue(),
      ]);
      if (mRes.data) setMedicines(mRes.data);
      if (lowRes.data) setLowStockMeds(lowRes.data);
      if (expRes.data) setExpiryAlerts(expRes.data);
      if (qRes.data) setPrescriptions(qRes.data);
    } catch (err: any) {
      console.error('Failed to load pharmacy data:', err);
      setErrorMessage(err.message || 'Failed to load pharmacy telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.pharmacy.adjustStock({
        medicineId: selectedMed.id,
        quantityDelta: adjustmentQuantity,
        reason: adjustmentReason,
      });
      setSuccessMessage(`Stock adjusted for ${selectedMed.name}.`);
      setAdjustModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.createMedicine(newMedForm);
      setSuccessMessage(`Medicine ${newMedForm.brandName} added to formulary.`);
      setAddMedModalOpen(false);
      setNewMedForm({
        brandName: '',
        genericName: '',
        category: 'ANTIBIOTIC',
        strength: '500mg',
        dosageForm: 'TABLET',
        manufacturer: 'Aalayam Pharma',
        unitPrice: 15,
        reorderLevel: 20,
        initialStock: 100,
      });
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMedStatus = async (med: any) => {
    try {
      setErrorMessage('');
      await apiClient.hospitalAdmin.toggleMedicineStatus(med.id);
      setSuccessMessage(`Medicine ${med.brandName || med.name} status updated.`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle status');
    }
  };

  if (loading) return <LoadingState message="Loading hospital pharmacy formulary and stock alerts..." />;

  const filteredMedicines = medicines.filter((m) => {
    const name = (m.name || '').toLowerCase();
    const brand = (m.brandName || '').toLowerCase();
    const comp = (m.composition || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return name.includes(q) || brand.includes(q) || comp.includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Messages */}
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
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-[#E0F2F1] text-[#00897B] rounded-xl border border-[#B2DFDB]">
            <Pill className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pharmacy & Formulary Inventory Command</h1>
            <p className="text-xs text-slate-500">
              Formulary stock, batch expiry monitoring, and digital dispensing queue overview
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setAddMedModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Medicine
          </button>

          {/* Tab switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200">
            <button
              onClick={() => setActiveTab('INVENTORY')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'INVENTORY' ? 'bg-white text-[#00897B] shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Formulary Stock ({medicines.length})
            </button>
            <button
              onClick={() => setActiveTab('LOW_STOCK')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'LOW_STOCK' ? 'bg-white text-amber-700 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Low-Stock Alerts ({lowStockMeds.length})
            </button>
            <button
              onClick={() => setActiveTab('QUEUE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'QUEUE' ? 'bg-white text-[#1565C0] shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Dispense Queue ({prescriptions.length})
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search medicine, brand, or chemical formula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* INVENTORY TAB */}
      {activeTab === 'INVENTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Medicine & Formulation</th>
                  <th className="py-3 px-4">Dosage / Composition</th>
                  <th className="py-3 px-4">Manufacturer</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Unit Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMedicines.map((m) => {
                  const isLow = m.currentStock <= 50;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{m.name}</div>
                        <span className="text-[10px] text-slate-400">{m.brandName || m.dosageForm}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{m.composition || 'Standard formulation'}</td>
                      <td className="py-3.5 px-4 text-slate-500">{m.manufacturer || 'Authorized Generic'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full font-bold text-xs ${
                            isLow ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]' : 'bg-[#DCFCE7] text-[#16A34A]'
                          }`}
                        >
                          {m.currentStock} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                        ₹{Number(m.unitPrice || 12)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedMed(m);
                            setAdjustmentQuantity(100);
                            setAdjustmentReason('Stock Replenishment');
                            setAdjustModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[#00897B] bg-[#E0F2F1] hover:bg-[#E0F2F1] rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOW STOCK TAB */}
      {activeTab === 'LOW_STOCK' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-amber-800 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Critical Formulary Depletion Warnings (≤ 50 Units)
          </div>

          {lowStockMeds.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No medicines currently below reorder levels.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockMeds.map((med) => (
                <div
                  key={med.id}
                  className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-xl flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-[#DC2626] uppercase">Critical Low</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">{med.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{med.composition || 'Generic'}</p>
                    <div className="mt-2 text-xs font-semibold text-amber-900">
                      Remaining Stock: <span className="text-[#DC2626] font-bold">{med.currentStock} units</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedMed(med);
                      setAdjustmentQuantity(100);
                      setAdjustmentReason('Critical Low Reorder');
                      setAdjustModalOpen(true);
                    }}
                    className="mt-3 w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
                  >
                    Generate Purchase Restock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUEUE TAB */}
      {activeTab === 'QUEUE' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Rx Number</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Prescribed Doctor</th>
                  <th className="py-3 px-4">Medications Count</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#00897B]">
                      {rx.prescriptionNumber || rx.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {rx.patient?.firstName} {rx.patient?.lastName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {rx.doctor?.employee?.user
                        ? `Dr. ${rx.doctor.employee.user.firstName} ${rx.doctor.employee.user.lastName}`
                        : 'Doctor'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {rx.items?.length || 1} prescription items
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <StatusBadge status={rx.status || 'PENDING'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESTOCK MODAL */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Restock Formulary: ${selectedMed?.name}`}
      >
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <p className="text-xs text-slate-500">
            Current balance: <span className="font-bold text-slate-800">{selectedMed?.currentStock} units</span>
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Add Units to Stock *</label>
            <input
              type="number"
              min={1}
              required
              value={adjustmentQuantity}
              onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Reason</label>
            <input
              type="text"
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1565C0] hover:bg-[#0D47A1] rounded-lg shadow-sm"
            >
              {submitting ? 'Applying...' : 'Confirm Restock'}
            </button>
          </div>
        </form>
      </Modal>
      {/* ADD MEDICINE MODAL */}
      <Modal isOpen={addMedModalOpen} onClose={() => setAddMedModalOpen(false)} title="Add Medicine to Formulary Catalogue">
        <form onSubmit={handleCreateMedicine} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={newMedForm.brandName}
                onChange={(e) => setNewMedForm({ ...newMedForm, brandName: e.target.value })}
                placeholder="e.g. Paracip 500"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Name *</label>
              <input
                type="text"
                required
                value={newMedForm.genericName}
                onChange={(e) => setNewMedForm({ ...newMedForm, genericName: e.target.value })}
                placeholder="e.g. Paracetamol"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newMedForm.category}
                onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ANALGESIC">Analgesic / Antipyretic</option>
                <option value="ANTIBIOTIC">Antibiotic</option>
                <option value="ANTIHYPERTENSIVE">Antihypertensive</option>
                <option value="ANTIDIABETIC">Antidiabetic</option>
                <option value="ANTIHISTAMINE">Antihistamine</option>
                <option value="VITAMIN">Vitamins & Minerals</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Strength</label>
              <input
                type="text"
                value={newMedForm.strength}
                onChange={(e) => setNewMedForm({ ...newMedForm, strength: e.target.value })}
                placeholder="e.g. 500mg"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage Form</label>
              <select
                value={newMedForm.dosageForm}
                onChange={(e) => setNewMedForm({ ...newMedForm, dosageForm: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="TABLET">Tablet</option>
                <option value="CAPSULE">Capsule</option>
                <option value="SYRUP">Syrup</option>
                <option value="INJECTION">Injection</option>
                <option value="OINTMENT">Ointment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={newMedForm.unitPrice}
                onChange={(e) => setNewMedForm({ ...newMedForm, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level</label>
              <input
                type="number"
                min="1"
                value={newMedForm.reorderLevel}
                onChange={(e) => setNewMedForm({ ...newMedForm, reorderLevel: parseInt(e.target.value) || 20 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock Batch</label>
              <input
                type="number"
                min="0"
                value={newMedForm.initialStock}
                onChange={(e) => setNewMedForm({ ...newMedForm, initialStock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer</label>
            <input
              type="text"
              value={newMedForm.manufacturer}
              onChange={(e) => setNewMedForm({ ...newMedForm, manufacturer: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddMedModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1565C0] hover:bg-[#0D47A1] rounded-lg shadow-sm"
            >
              {submitting ? 'Adding...' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
