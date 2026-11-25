import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { exportToCSV } from '../../utils/exportReport';
import {
  HeartPulse,
  Search,
  Download,
  User,
  Phone,
  Droplet,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const PatientOperations: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await apiClient.patients.search(searchTerm || undefined);
      if (res.data) setPatients(res.data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredPatients = patients.filter((p) => {
    if (genderFilter && p.gender !== genderFilter) return false;
    return true;
  });

  const handleExportCSV = () => {
    exportToCSV({
      title: 'Hospital Patient Census & Registration Ledger',
      headers: ['UHID', 'Patient Name', 'Gender', 'Blood Group', 'Phone', 'Emergency Contact', 'Registered Date'],
      rows: filteredPatients.map((p) => [
        p.uhid,
        `${p.firstName} ${p.lastName}`,
        p.gender,
        p.bloodGroup || 'Unknown',
        p.phone,
        p.emergencyContactName ? `${p.emergencyContactName} (${p.emergencyContactPhone})` : 'N/A',
        new Date(p.createdAt).toLocaleDateString('en-IN'),
      ]),
      fileName: 'patient_census_ledger',
    });
  };

  if (loading && patients.length === 0) {
    return <LoadingState message="Loading hospital patient registry & clinical census..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
            <HeartPulse className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Hospital Patient Operations & Census</h1>
            <p className="text-xs text-slate-500">
              Universal health identifier (UHID) records, demographic census, and clinical registry
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export Patient Census
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by UHID, patient name, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-slate-400 font-medium">Gender:</span>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">UHID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Demographics</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Emergency Contact</th>
                <th className="py-3 px-4 text-right">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No patients matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{p.uhid}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="capitalize">{p.gender?.toLowerCase()}</span>
                      {p.dateOfBirth && (
                        <span className="text-slate-400 ml-1">
                          (DOB: {new Date(p.dateOfBirth).toLocaleDateString('en-IN')})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.bloodGroup ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Droplet className="w-3 h-3 text-rose-600" />
                          {p.bloodGroup}
                        </span>
                      ) : (
                        <span className="text-slate-400">Not recorded</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{p.phone}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.emergencyContactName ? (
                        <div>
                          <span className="font-semibold text-slate-800">{p.emergencyContactName}</span>
                          <span className="text-[10px] text-slate-400 block">{p.emergencyContactPhone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-medium">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
