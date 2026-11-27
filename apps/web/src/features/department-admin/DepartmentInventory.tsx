import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Pill,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const DepartmentInventory: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [requestQuantity, setRequestQuantity] = useState(10);
  const [requestReason, setRequestReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getInventory({
        category: categoryFilter || undefined,
        lowStockOnly: lowStockOnly || undefined,
      });
      if (res.data) setItems(res.data);
    } catch (err: any) {
      console.error('Failed to load department inventory:', err);
      setError(err.message || 'Failed to load department supplies and inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [categoryFilter, lowStockOnly]);

  const handleOpenRequisition = (item?: any) => {
    setSelectedItem(item || null);
    setRequestQuantity(item ? Math.max(item.minimumStock ? item.minimumStock * 2 : 10, 10) : 10);
    setRequestReason('');
    setShowRequisitionModal(true);
  };

  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      await apiClient.departmentAdmin.submitInventoryRequest({
        itemId: selectedItem?.id,
        itemName: selectedItem?.name || 'Department Requisition',
        quantity: Number(requestQuantity),
        reason: requestReason,
      });
      setShowRequisitionModal(false);
      setSuccessMessage('Restock requisition submitted to central pharmacy / central store.');
      setTimeout(() => setSuccessMessage(''), 4000);
      loadInventory();
    } catch (err: any) {
      console.error('Failed to submit requisition:', err);
      setError(err.message || 'Failed to submit restock requisition');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = items.filter((item) => {
    if (!search) return true;
    const name = (item.name || '').toLowerCase();
    const code = (item.code || item.sku || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase()) || cat.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Pill className="w-6 h-6 text-[#00897B]" />
            Department Supplies & Pharmacy Sub-Stock
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor department consumables, dressing sets, emergency drugs, and request central store replenishment.
          </p>
        </div>
        <button
          onClick={() => handleOpenRequisition()}
          className="px-4 py-2.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Request Stock Replenishment
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl flex items-center gap-2 text-[#16A34A] text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-[#DC2626] text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catalogued Items</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{items.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Sufficient Stock</p>
          <p className="text-2xl font-black text-[#16A34A] mt-1">
            {items.filter((i) => (i.currentStock || 0) > (i.minimumStock || 5)).length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Low Stock Warnings</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {items.filter((i) => (i.currentStock || 0) <= (i.minimumStock || 5) && (i.currentStock || 0) > 0).length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Stockouts (Zero)</p>
          <p className="text-2xl font-black text-[#DC2626] mt-1">
            {items.filter((i) => (i.currentStock || 0) === 0).length}
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search supplies, medications, consumables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
          />
        </div>
        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            lowStockOnly
              ? 'bg-amber-500 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Low Stock Only
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading department supplies..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No Inventory Items Found</p>
          <p className="text-xs text-slate-400 mt-1">No supplies or medicines match your search criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Item Name & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Min. Threshold</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((item) => {
                  const stock = item.currentStock ?? 0;
                  const min = item.minimumStock ?? 5;
                  const isOut = stock === 0;
                  const isLow = stock <= min;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.code || item.sku || 'SKU-GEN'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {item.category || 'Supplies'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {stock} {item.unit || 'units'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {min} {item.unit || 'units'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-[#DC2626]">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#DCFCE7] text-[#16A34A]">
                            Adequate
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenRequisition(item)}
                          className="px-2.5 py-1 text-[11px] font-bold text-[#00897B] bg-[#E0F2F1] hover:bg-[#E0F2F1] rounded-lg transition"
                        >
                          Reorder
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

      {/* Requisition Modal */}
      {showRequisitionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#00897B]" />
                <h3 className="text-base font-black text-slate-800">Department Stock Requisition</h3>
              </div>
              <button
                onClick={() => setShowRequisitionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequisition} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Item Requested</label>
                <input
                  type="text"
                  disabled={!!selectedItem}
                  defaultValue={selectedItem?.name || ''}
                  placeholder="Enter supply or medication name"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Quantity Requested *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={requestQuantity}
                  onChange={(e) => setRequestQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Requisition Justification</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Depleted emergency tray, planned surgical procedures..."
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequisitionModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold rounded-xl text-xs transition shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Send Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
