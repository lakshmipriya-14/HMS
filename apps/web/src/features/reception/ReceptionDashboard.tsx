import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { LoadingState } from '../../components/LoadingState';
import {
  UserPlus,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  CreditCard,
  Ticket,
} from 'lucide-react';

export const ReceptionDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'register' | 'search'>('queue');
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('1985-01-01');
  const [gender, setGender] = useState('MALE');
  const [bloodGroup, setBloodGroup] = useState('O_POSITIVE');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Madurai');
  const [state, setState] = useState('Tamil Nadu');
  const [postalCode, setPostalCode] = useState('625020');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Family');

  // Book Appointment State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookPatientId, setBookPatientId] = useState('');
  const [bookDoctorId, setBookDoctorId] = useState('');
  const [bookDeptId, setBookDeptId] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookTime, setBookTime] = useState('11:00 AM');
  const [bookReason, setBookReason] = useState('General Consultation');

  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [registeredPatientSuccess, setRegisteredPatientSuccess] = useState<any>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const fetchQueue = async () => {
    try {
      const res = await apiClient.reception.getTodayQueue();
      if (res.data) setQueue(res.data);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [docRes, deptRes] = await Promise.all([
        apiClient.admin.getUsers({ role: 'DOCTOR' }),
        apiClient.admin.getDepartments(),
      ]);
      if (docRes.data) setDoctors(docRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchMasterData();
  }, []);

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.reception.registerPatient({
        firstName,
        lastName,
        dateOfBirth: dob,
        gender: gender as any,
        bloodGroup: bloodGroup as any,
        phone,
        email: email || undefined,
        addressLine1: address,
        city,
        state,
        postalCode,
        emergencyContactName: emergencyName || `${firstName} Family`,
        emergencyContactPhone: emergencyPhone || phone,
        emergencyContactRelation: emergencyRelation,
        hospitalId: 'default',
      });

      setRegisteredPatientSuccess(res.data);
      setBookPatientId(res.data.id);
      setIsBookModalOpen(true);
      // Reset form
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setAddress('');
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.reception.bookAppointment({
        patientId: bookPatientId,
        doctorId: bookDoctorId || doctors[0]?.employee?.doctor?.id || doctors[0]?.id,
        departmentId: bookDeptId || departments[0]?.id,
        hospitalId: 'default',
        appointmentDate: bookDate,
        appointmentTime: bookTime,
        appointmentType: 'OPD' as any,
        reasonForVisit: bookReason,
      });

      alert('Appointment booked successfully! Token generated.');
      setIsBookModalOpen(false);
      setRegisteredPatientSuccess(null);
      fetchQueue();
    } catch (err: any) {
      alert(err.message || 'Booking failed');
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      await apiClient.reception.checkInAppointment(appointmentId);
      fetchQueue();
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await apiClient.reception.searchPatients(searchQuery);
      if (res.data) setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Front Desk & Patient Reception
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Patient registration with UHID generation, OPD token queues, and appointment scheduling
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
            Today's Tokens ({queue.length})
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + Register Patient
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'search' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Find UHID
          </button>
        </div>
      </div>

      {/* Tab 1: Queue */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800">Live Outpatient Queue Board</h3>
            <span className="text-xs text-teal-600 font-semibold">Auto-refreshing</span>
          </div>

          {loading ? (
            <LoadingState message="Fetching today's appointments..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Token #</th>
                    <th className="py-3 px-4">Patient Name & UHID</th>
                    <th className="py-3 px-4">Doctor</th>
                    <th className="py-3 px-4">Time Slot</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-700 text-sm">
                        #{apt.tokenNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {apt.patient?.firstName} {apt.patient?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          UHID: {apt.patient?.uhid}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        Dr. {apt.doctor?.employee?.user?.firstName} {apt.doctor?.employee?.user?.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{apt.appointmentTime}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={apt.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {apt.status === 'SCHEDULED' ? (
                          <button
                            onClick={() => handleCheckIn(apt.id)}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                          >
                            Check-In Patient
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-[11px]">
                            Checked-In
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Register Patient */}
      {activeTab === 'register' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 max-w-4xl">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 mb-6">
            <UserPlus className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-base">New Patient Registration</h3>
          </div>

          <form onSubmit={handleRegisterPatient} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Patient given name"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Surname / Family name"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                >
                  <option value="O_POSITIVE">O +ve</option>
                  <option value="O_NEGATIVE">O -ve</option>
                  <option value="A_POSITIVE">A +ve</option>
                  <option value="A_NEGATIVE">A -ve</option>
                  <option value="B_POSITIVE">B +ve</option>
                  <option value="B_NEGATIVE">B -ve</option>
                  <option value="AB_POSITIVE">AB +ve</option>
                  <option value="AB_NEGATIVE">AB -ve</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (for SMS & UHID lookup) *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98400 00000"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@gmail.com"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Residential Street Address *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Door No, Street Name, Area..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors inline-flex items-center space-x-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Create Patient & Issue UHID</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Search */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
            <input
              type="text"
              placeholder="Search by UHID, phone number, or patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
            >
              Search
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">UHID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">City</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {searchResults.map((pt) => (
                    <tr key={pt.id}>
                      <td className="p-3 font-mono font-bold text-teal-700">{pt.uhid}</td>
                      <td className="p-3 font-semibold text-slate-800">
                        {pt.firstName} {pt.lastName}
                      </td>
                      <td className="p-3 text-slate-600">{pt.phone}</td>
                      <td className="p-3 text-slate-600">{pt.city}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setBookPatientId(pt.id);
                            setIsBookModalOpen(true);
                          }}
                          className="px-3 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded text-xs font-semibold border border-teal-200"
                        >
                          Book Token
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule OPD Appointment & Issue Token"
        subtitle="Select doctor and appointment slot"
      >
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Department
            </label>
            <select
              value={bookDeptId}
              onChange={(e) => setBookDeptId(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Doctor</label>
            <select
              value={bookDoctorId}
              onChange={(e) => setBookDoctorId(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.employee?.doctor?.id || doc.id}>
                  Dr. {doc.firstName} {doc.lastName} ({doc.employee?.designation || 'Consultant'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={bookDate}
                onChange={(e) => setBookDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
              <input
                type="text"
                value={bookTime}
                onChange={(e) => setBookTime(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Visit
            </label>
            <input
              type="text"
              value={bookReason}
              onChange={(e) => setBookReason(e.target.value)}
              placeholder="e.g. Fever, chest pain, sugar checkup"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Confirm Booking & Generate Token
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
