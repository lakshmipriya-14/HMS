import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import {
  FlaskConical,
  Scan,
  Search,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export const DiagnosticsOverview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LAB' | 'RADIOLOGY'>('LAB');
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [labCatalogue, setLabCatalogue] = useState<any[]>([]);
  const [radioWorklist, setRadioWorklist] = useState<any[]>([]);
  const [radioCatalogue, setRadioCatalogue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [lOrders, lCat, rWork, rCat] = await Promise.all([
        apiClient.laboratory.getWorklist(),
        apiClient.laboratory.getCatalogue(),
        apiClient.radiology.getWorklist(),
        apiClient.radiology.getCatalogue(),
      ]);
      if (lOrders.data) setLabOrders(lOrders.data);
      if (lCat.data) setLabCatalogue(lCat.data);
      if (rWork.data) setRadioWorklist(rWork.data);
      if (rCat.data) setRadioCatalogue(rCat.data);
    } catch (err) {
      console.error('Failed to load diagnostics telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState message="Loading hospital diagnostic workloads & analyzer queues..." />;

  const filteredLabOrders = labOrders.filter((o) => {
    const pName = `${o.patient?.firstName || ''} ${o.patient?.lastName || ''}`.toLowerCase();
    const orderNo = (o.orderNumber || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return pName.includes(q) || orderNo.includes(q);
  });

  const filteredRadioOrders = radioWorklist.filter((o) => {
    const pName = `${o.patient?.firstName || ''} ${o.patient?.lastName || ''}`.toLowerCase();
    const orderNo = (o.orderNumber || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return pName.includes(q) || orderNo.includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-[#E8F1FC] text-[#1565C0] rounded-xl border border-[#BFDBFE]">
            <FlaskConical className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Diagnostics & Clinical Laboratories Command</h1>
            <p className="text-xs text-slate-500">
              Pathology analyzer worklists, radiology imaging modalities, and diagnostic turn-around times
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200">
          <button
            onClick={() => setActiveTab('LAB')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'LAB' ? 'bg-white text-[#00897B] shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Pathology Lab ({labOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('RADIOLOGY')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'RADIOLOGY' ? 'bg-white text-[#1565C0] shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            <Scan className="w-4 h-4" />
            Radiology & Imaging ({radioWorklist.length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by order number or patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* PATHOLOGY TAB */}
      {activeTab === 'LAB' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Active Laboratory Orders & Analyzer Worklist</h3>
              <span className="text-xs text-slate-500">
                {filteredLabOrders.length} orders currently undergoing sample triage or verification
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Tests Ordered</th>
                    <th className="py-3 px-4">Ordering Doctor</th>
                    <th className="py-3 px-4">Order Date</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLabOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No active laboratory orders.
                      </td>
                    </tr>
                  ) : (
                    filteredLabOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#00897B]">{o.orderNumber}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">
                            {o.patient?.firstName} {o.patient?.lastName}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{o.patient?.uhid}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {o.items?.map((i: any) => i.test?.name || 'Test').join(', ') || 'Diagnostic Panel'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {o.doctor?.employee?.user
                            ? `Dr. ${o.doctor.employee.user.firstName} ${o.doctor.employee.user.lastName}`
                            : 'Attending Physician'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <StatusBadge status={o.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Test Catalogue */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Diagnostic Test Catalogue</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {labCatalogue.map((t) => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">{t.name}</h5>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{t.code}</span>
                  </div>
                  <span className="font-bold text-xs text-[#00897B]">₹{Number(t.price || 250)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RADIOLOGY TAB */}
      {activeTab === 'RADIOLOGY' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Radiology Modality Worklist (X-Ray, CT, MRI, USG)</h3>
              <span className="text-xs text-slate-500">{filteredRadioOrders.length} active scan studies</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Scan Study</th>
                    <th className="py-3 px-4">Modality</th>
                    <th className="py-3 px-4">Scheduled Date</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRadioOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No active imaging studies.
                      </td>
                    </tr>
                  ) : (
                    filteredRadioOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1565C0]">{o.orderNumber}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">
                            {o.patient?.firstName} {o.patient?.lastName}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{o.patient?.uhid}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">{o.test?.name || 'Imaging Scan'}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-[#E8F1FC] text-[#1565C0] border border-[#BFDBFE]">
                            {o.test?.modality || 'X-RAY'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <StatusBadge status={o.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Radiology Catalogue */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Imaging Modalities & Scan Catalogue</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {radioCatalogue.map((t) => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">{t.name}</h5>
                    <span className="text-[10px] text-[#1565C0] font-mono uppercase font-bold">{t.modality}</span>
                  </div>
                  <span className="font-bold text-xs text-[#00897B]">₹{Number(t.price || 1200)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
