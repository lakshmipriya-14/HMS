import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import {
  BarChart3,
  Calendar,
  Download,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Activity,
  BedDouble,
  Stethoscope,
  AlertCircle,
} from 'lucide-react';

export const DepartmentReports: React.FC = () => {
  const [reportType, setReportType] = useState('opd_census');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getReports({
        type: reportType,
        fromDate,
        toDate,
      });
      if (res.data) setReportData(res.data);
    } catch (err: any) {
      console.error('Failed to load department report:', err);
      setError(err.message || 'Failed to load report analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, fromDate, toDate]);

  const handleExportCSV = () => {
    if (!reportData?.rows || reportData.rows.length === 0) return;
    const headers = Object.keys(reportData.rows[0]).join(',');
    const rows = reportData.rows.map((r: any) => Object.values(r).map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Department_Report_${reportType}_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#00897B]" />
            Department Analytics & Operational Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department-level operational throughput, doctor productivity, patient census, and resource utilization.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!reportData?.rows?.length}
          className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#00897B]" />
          Export CSV Spreadsheet
        </button>
      </div>

      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-[#DC2626] text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Report Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-64">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Report Category
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition font-semibold text-slate-700"
          >
            <option value="opd_census">OPD Registrations & Consultations</option>
            <option value="ipd_census">IPD Admissions & Bed Occupancy</option>
            <option value="doctor_workload">Doctor Productivity & Consult Volume</option>
            <option value="diagnostics_volume">Lab & Radiology Orders Volume</option>
            <option value="bed_turnover">Bed Turnover & Length of Stay</option>
          </select>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition font-mono"
            />
          </div>
        </div>

        <button
          onClick={loadReport}
          className="sm:self-end px-4 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition shadow-sm w-full sm:w-auto"
        >
          Generate
        </button>
      </div>

      {/* KPI Cards */}
      {reportData?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(reportData.summary).map(([key, val]: [string, any]) => (
            <div key={key} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {key.replace(/([A-Z])/g, ' $1')}
              </p>
              <p className="text-2xl font-black text-slate-800 mt-1">{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Report Table */}
      {loading ? (
        <LoadingState message="Compiling department operational data..." />
      ) : !reportData?.rows || reportData.rows.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No Records Found</p>
          <p className="text-xs text-slate-400 mt-1">
            No department activity was logged for the selected dates and parameters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  {Object.keys(reportData.rows[0]).map((col) => (
                    <th key={col} className="py-3 px-4">
                      {col.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reportData.rows.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    {Object.values(row).map((val: any, cidx: number) => (
                      <td key={cidx} className="py-3 px-4 font-medium text-slate-700">
                        {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
