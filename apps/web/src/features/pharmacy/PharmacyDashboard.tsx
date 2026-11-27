import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { LoadingState } from '../../components/LoadingState';
import {
  Pill,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

export const PharmacyDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'inventory' | 'lowstock'>('queue');
  const [queue, setQueue] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispensing State
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [dispenseBatches, setDispenseBatches] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPharmacyData = async () => {
    try {
      const [queueRes, medRes, lowRes] = await Promise.all([
        apiClient.pharmacy.getPrescriptionQueue(),
        apiClient.pharmacy.getMedicines(),
        apiClient.pharmacy.getLowStock(),
      ]);
      if (queueRes.data) setQueue(queueRes.data);
      if (medRes.data) setMedicines(medRes.data);
      if (lowRes.data) setLowStock(lowRes.data);
    } catch (err) {
      console.error('Error fetching pharmacy records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const openDispenseModal = (rx: any) => {
    setSelectedPrescription(rx);
    const defaults: Record<string, string> = {};
    rx.items?.forEach((item: any) => {
      if (item.medicine?.batches?.length > 0) {
        defaults[item.id] = item.medicine.batches[0].id;
      }
    });
    setDispenseBatches(defaults);
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrescription) return;

    setIsSubmitting(true);
    try {
      const itemsToDispense = selectedPrescription.items.map((item: any) => ({
        prescriptionItemId: item.id,
        batchId: dispenseBatches[item.id] || item.medicine?.batches?.[0]?.id || 'batch-default',
        dispensedQuantity: item.durationDays * 2, // simple calculated quantity
      }));

      await apiClient.pharmacy.dispensePrescription({
        prescriptionId: selectedPrescription.id,
        pharmacistId: 'current',
        items: itemsToDispense,
      });

      alert('Medications dispensed successfully and stock adjusted.');
      setSelectedPrescription(null);
      fetchPharmacyData();
    } catch (err: any) {
      alert(err.message || 'Dispensing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading pharmacy inventory and prescriptions queue..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Pharmacy Dispensary & Formulary Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time prescription queue, automated stock batch tracking, FEFO dispensing, and expiry surveillance
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'queue' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Prescription Queue ({queue.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'inventory' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Medicine Catalogue ({medicines.length})
          </button>
          <button
            onClick={() => setActiveTab('lowstock')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'lowstock' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stock Warnings ({lowStock.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Prescriptions Queue */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800">Prescriptions Awaiting Fulfillment</h3>
            <span className="text-xs text-slate-500">{queue.length} pending orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Prescription #</th>
                  <th className="py-3 px-4">Patient Name & UHID</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Prescribed Items</th>
                  <th className="py-3 px-4">Dispensing Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#00897B]">
                      {rx.prescriptionNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {rx.patient?.firstName} {rx.patient?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        UHID: {rx.patient?.uhid}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      Dr. {rx.doctor?.employee?.user?.firstName} {rx.doctor?.employee?.user?.lastName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {rx.items?.map((item: any) => (
                          <div key={item.id} className="text-slate-700 text-[11px]">
                            <span className="font-semibold">{item.medicine?.brandName || item.dosage}</span>
                            <span className="text-slate-400 ml-1">({item.frequency} for {item.durationDays}d)</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={rx.dispensingStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openDispenseModal(rx)}
                        className="px-3 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        Verify & Dispense
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Medicine Catalogue */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Medicine Brand</th>
                  <th className="py-3 px-4">Generic Composition</th>
                  <th className="py-3 px-4">Dosage Form</th>
                  <th className="py-3 px-4">Manufacturer</th>
                  <th className="py-3 px-4">Stock on Hand</th>
                  <th className="py-3 px-4">Unit Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-800">{med.brandName}</td>
                    <td className="py-3 px-4 text-slate-600">{med.genericName} ({med.strength})</td>
                    <td className="py-3 px-4 text-slate-500">{med.dosageForm}</td>
                    <td className="py-3 px-4 text-slate-500">{med.manufacturer}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold font-mono px-2 py-0.5 rounded text-[11px] ${
                          med.currentStock <= med.reorderLevel
                            ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                            : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                        }`}
                      >
                        {med.currentStock} units
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">₹{med.unitPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Low Stock Alerts */}
      {activeTab === 'lowstock' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center space-x-2 text-[#DC2626] font-bold mb-4">
            <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
            <h3>Critical Stock & Reorder Alerts</h3>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-xs text-slate-500">All medicines currently have adequate safety buffer stock.</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((med) => (
                <div
                  key={med.id}
                  className="p-4 bg-[#FEE2E2]/60 border border-[#FECACA] rounded-xl flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{med.brandName}</h4>
                    <p className="text-xs text-slate-600">{med.genericName} - {med.strength}</p>
                    <p className="text-xs text-[#DC2626] font-semibold mt-1">
                      Current Stock: {med.currentStock} units (Reorder Threshold: {med.reorderLevel})
                    </p>
                  </div>
                  <button className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg text-xs font-semibold shadow-sm">
                    Generate Purchase Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dispense Modal */}
      <Modal
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        title={`Dispense Prescription — ${selectedPrescription?.prescriptionNumber}`}
        subtitle={`Patient: ${selectedPrescription?.patient?.firstName} ${selectedPrescription?.patient?.lastName}`}
      >
        <form onSubmit={handleDispense} className="space-y-4">
          <div className="space-y-3">
            {selectedPrescription?.items?.map((item: any) => (
              <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>{item.medicine?.brandName || item.dosage}</span>
                  <span className="text-[#00897B]">{item.frequency} x {item.durationDays} days</span>
                </div>
                <div className="mt-2">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Select Batch (FEFO - First Expiring First Out)
                  </label>
                  <select
                    value={dispenseBatches[item.id] || ''}
                    onChange={(e) =>
                      setDispenseBatches((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                  >
                    {item.medicine?.batches?.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        Batch: {b.batchNumber} (Expires:{' '}
                        {new Date(b.expiryDate).toLocaleDateString()} | Stock: {b.quantity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedPrescription(null)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              {isSubmitting ? 'Dispensing...' : 'Confirm Dispensing & Update Inventory'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
