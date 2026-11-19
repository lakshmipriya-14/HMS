import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { LoadingState } from '../../components/LoadingState';
import { Scan, FileText, AlertOctagon, CheckCircle, ShieldCheck } from 'lucide-react';

export const RadiologyDashboard: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Report state
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [criticalAlert, setCriticalAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorklist = async () => {
    try {
      const res = await apiClient.radiology.getWorklist();
      if (res.data) setOrders(res.data);
    } catch (err) {
      console.error('Failed to load radiology worklist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklist();
  }, []);

  const openReportModal = (order: any) => {
    setSelectedOrder(order);
    setFindings(order.findings || '');
    setImpression(order.impression || '');
    setCriticalAlert(order.criticalAlert || false);
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsSubmitting(true);
    try {
      await apiClient.radiology.uploadReport(selectedOrder.id, {
        orderId: selectedOrder.id,
        findings,
        impression,
        criticalAlert,
      });

      alert('Radiology imaging findings validated and officially released!');
      setSelectedOrder(null);
      fetchWorklist();
    } catch (err: any) {
      alert(err.message || 'Error releasing scan report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading radiology imaging schedule and PACs worklist..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Radiology & Diagnostic Imaging
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            CT, MRI, Digital X-Ray, and Ultrasound examination worklists, findings entry, and verified release
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Scan className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-800">Diagnostic Imaging Schedule</h3>
          </div>
          <span className="text-xs text-slate-500">{orders.length} studies listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Order Code</th>
                <th className="py-3 px-4">Patient Name & UHID</th>
                <th className="py-3 px-4">Study / Modality</th>
                <th className="py-3 px-4">Referring Doctor</th>
                <th className="py-3 px-4">Clinical Indication</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{o.orderNumber}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">
                      {o.patient?.firstName} {o.patient?.lastName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      UHID: {o.patient?.uhid}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{o.test?.name}</div>
                    <div className="text-[10px] text-teal-700 font-bold uppercase">{o.test?.modality}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    Dr. {o.doctor?.employee?.user?.firstName} {o.doctor?.employee?.user?.lastName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{o.clinicalIndication}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {o.status === 'REPORT_RELEASED' ? (
                      <span className="text-emerald-600 font-semibold text-[11px]">Report Released</span>
                    ) : (
                      <button
                        onClick={() => openReportModal(o)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        Enter Findings & Release
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enter Report Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Radiology Examination Report — ${selectedOrder?.test?.name}`}
        subtitle={`Order: ${selectedOrder?.orderNumber} | Patient: ${selectedOrder?.patient?.firstName} ${selectedOrder?.patient?.lastName}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveReport} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Radiological Findings
            </label>
            <textarea
              rows={4}
              required
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Systematic anatomical review: cardiac silhouette, lung fields, pleura, bony thorax..."
              className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Final Impression
            </label>
            <textarea
              rows={2}
              required
              value={impression}
              onChange={(e) => setImpression(e.target.value)}
              placeholder="e.g. Mild cardiomegaly noted. No acute pulmonary infiltrate."
              className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Critical Findings Alert Toggle */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-slate-800">Flag Critical Radiological Alert</h5>
              <p className="text-[11px] text-slate-500">
                Immediately sends high-priority notification to attending clinical doctor
              </p>
            </div>
            <input
              type="checkbox"
              checked={criticalAlert}
              onChange={(e) => setCriticalAlert(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm inline-flex items-center space-x-1"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Releasing...' : 'Sign & Release Diagnostic Scan'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
