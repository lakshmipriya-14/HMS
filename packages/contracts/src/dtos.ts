import {
  AdmissionStatus,
  AppointmentStatus,
  AppointmentType,
  BedStatus,
  BedType,
  BloodGroup,
  ClaimStatus,
  ConsultationStatus,
  DoctorDesignation,
  EmergencySeverity,
  Gender,
  InvoiceStatus,
  PaymentMethod,
  Priority,
  RadiologyStatus,
  Role,
  SampleStatus,
  TripStatus,
} from './enums.js';

// Auth DTOs
export interface LoginRequestDto {
  email: string;
  password: string;
  selectedRole?: Role;
}

export interface AuthUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  roles: Role[];
  permissions: string[];
  hospitalId?: string;
  branchId?: string;
  departmentId?: string;
  doctorProfileId?: string;
  patientProfileId?: string;
  nurseProfileId?: string;
  employeeId?: string;
}

export interface SwitchRoleRequestDto {
  role: Role;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUserDto;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetProof {
  challengeId: string;
  resetToken: string;
}

export interface AuthSessionSummaryDto {
  id: string;
  issuedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface SuperAdminDashboardDto {
  branches: number;
  activeBranches: number;
  inactiveBranches: number;
  admins: number;
  activeAdmins?: number;
  inactiveAdmins?: number;
  totalUsers?: number;
  employees: number;
  doctors: number;
  departments: number;
  patients: number;
  usersByRole?: Record<string, number>;
  branchWiseStats?: {
    id: string;
    name: string;
    code: string;
    city?: string;
    isActive: boolean;
    departmentCount: number;
    doctorCount: number;
    employeeCount: number;
    patientCount?: number;
  }[];
  recentActivities?: {
    id: string;
    action: string;
    resource: string;
    resourceId?: string | null;
    userEmail: string;
    userRole: string;
    createdAt: string;
    branchName?: string | null;
    details?: any;
  }[];
  pendingActions?: {
    pendingAppointmentRequests: number;
    inactiveBranches: number;
    unassignedAdmins: number;
  };
}

// Patient DTOs
export interface RegisterPatientDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: BloodGroup;
  email?: string;
  phone: string;
  nationalId?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  allergies?: string[];
  medicalHistoryNotes?: string;
  hospitalId: string;
  branchId?: string;
  registrationBranchId?: string;
}

export interface PatientSearchQueryDto {
  query?: string;
  uhid?: string;
  phone?: string;
  email?: string;
  page?: number;
  limit?: number;
}

export interface UpdatePatientDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  allergies?: string[];
  medicalHistoryNotes?: string;
}

// Appointment DTOs
export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  departmentId: string;
  hospitalId: string;
  branchId?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: AppointmentType;
  reasonForVisit: string;
  priority?: Priority;
}

export interface RescheduleAppointmentDto {
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
}

export interface CancelAppointmentDto {
  reason?: string;
}

export interface CheckInAppointmentDto {
  appointmentId: string;
  vitals?: RecordVitalsDto;
}

// Doctor & Consultation DTOs
export interface CreateConsultationDto {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  physicalExaminationNotes?: string;
  diagnosisNotes: string;
  icd10Codes?: string[];
  treatmentPlan: string;
  followUpDate?: string;
  admissionRecommended?: boolean;
  admissionDepartmentId?: string;
  admissionWardId?: string;
  admissionNotes?: string;
}

export interface PrescriptionItemDto {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
  route?: string;
}

export interface CreatePrescriptionDto {
  patientId: string;
  doctorId: string;
  consultationId?: string;
  appointmentId?: string;
  notes?: string;
  items: PrescriptionItemDto[];
}

// Nursing DTOs
export interface RecordVitalsDto {
  patientId: string;
  admissionId?: string;
  temperature?: number;
  systolicBp?: number;
  diastolicBp?: number;
  pulseRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weightKg?: number;
  heightCm?: number;
  bloodSugarMgDl?: number;
  notes?: string;
}

export interface CreateNursingTaskDto {
  patientId: string;
  admissionId: string;
  nurseId?: string;
  taskTitle: string;
  taskDescription: string;
  dueTime: string;
  priority: Priority;
}

export interface AdministerMedicationDto {
  prescriptionItemId: string;
  patientId: string;
  administeredDose: string;
  notes?: string;
}

// Laboratory DTOs
export interface CreateLabOrderDto {
  patientId: string;
  doctorId: string;
  encounterId?: string;
  clinicalNotes?: string;
  priority: Priority;
  testIds: string[];
}

export interface EnterLabResultItemDto {
  testParameterId: string;
  measuredValue: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  isCritical: boolean;
  remarks?: string;
}

export interface EnterLabResultsDto {
  orderId: string;
  results: EnterLabResultItemDto[];
  technicianNotes?: string;
}

// Pharmacy DTOs
export interface DispensePrescriptionDto {
  prescriptionId: string;
  pharmacistId: string;
  items: {
    prescriptionItemId: string;
    batchId: string;
    dispensedQuantity: number;
  }[];
  dispensingNotes?: string;
}

export interface AdjustStockDto {
  medicineId: string;
  batchId?: string;
  quantityChange: number;
  reason: string;
}

// Radiology DTOs
export interface CreateRadiologyOrderDto {
  patientId: string;
  doctorId: string;
  testId: string;
  priority: Priority;
  clinicalIndication: string;
  specialInstructions?: string;
}

export interface UploadRadiologyReportDto {
  orderId: string;
  findings: string;
  impression: string;
  criticalAlert: boolean;
  imageUrl?: string;
}

// Wards & Admissions DTOs
export interface AdmitPatientDto {
  patientId: string;
  admittingDoctorId: string;
  wardId: string;
  bedId: string;
  admissionReason: string;
  initialDiagnosis: string;
  estimatedStayDays?: number;
}

export interface TransferBedDto {
  admissionId: string;
  targetWardId: string;
  targetBedId: string;
  reason: string;
}

export interface DischargePatientDto {
  admissionId: string;
  dischargeSummary: string;
  followUpInstructions?: string;
  medicationOnDischarge?: string;
  dischargeType?: 'NORMAL' | 'LAMA' | 'REFERRED' | 'DEATH';
  finalDiagnosis?: string;
}

export interface DoctorRoundNoteDto {
  admissionId: string;
  progressNote: string;
  diagnosisUpdate?: string;
  treatmentPlanUpdate?: string;
  followUpInstructions?: string;
}

export interface AdvancePaymentDto {
  admissionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  notes?: string;
}

export interface IPDBillingCalculationDto {
  admissionId: string;
}

// Billing & Insurance DTOs
export interface InvoiceItemDto {
  description: string;
  category: 'CONSULTATION' | 'LAB' | 'RADIOLOGY' | 'PHARMACY' | 'ROOM' | 'PROCEDURE';
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  referenceId?: string;
}

export interface CreateInvoiceDto {
  patientId: string;
  hospitalId?: string;
  branchId?: string;
  admissionId?: string;
  appointmentId?: string;
  items: InvoiceItemDto[];
  taxPercentage?: number;
  discountAmount?: number;
  notes?: string;
}

export interface CollectPaymentDto {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  idempotencyKey?: string;
  requestFingerprint?: string;
  notes?: string;
}

export interface SubmitInsuranceClaimDto {
  invoiceId: string;
  patientId: string;
  insuranceProviderId: string;
  policyNumber: string;
  claimAmount: number;
  preAuthCode?: string;
  documents?: string[];
}

// Ambulance DTOs
export interface CreateAmbulanceRequestDto {
  callerName: string;
  callerPhone: string;
  pickupLocation: string;
  destinationHospitalId: string;
  emergencySeverity: EmergencySeverity;
  patientConditionSummary: string;
  patientId?: string;
}

export interface DispatchAmbulanceDto {
  requestId: string;
  vehicleId: string;
  driverId: string;
}

export interface UpdateTripStatusDto {
  status: TripStatus;
  currentLatitude?: number;
  currentLongitude?: number;
  notes?: string;
}

// Department Admin Workspace DTOs
export interface DepartmentAdminDashboardDto {
  department: {
    id: string;
    name: string;
    code: string;
    description?: string;
    workingHours?: string;
    capacity?: number;
    headOfDepartment?: { id: string; name: string; specialization?: string } | null;
    departmentAdmin?: { id: string; name: string; email: string } | null;
    branchId?: string;
    branchName?: string;
  };
  metrics: {
    totalPatients: number;
    todayOpdRegistrations: number;
    currentIpdPatients: number;
    todayAppointments: number;
    completedConsultations: number;
    pendingConsultations: number;
    availableDoctors: number;
    totalDoctors: number;
    availableStaff: number;
    totalStaff: number;
    bedOccupancyRate: number;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    pendingAdmissions: number;
    pendingDischarges: number;
    pendingLabRequests: number;
    pendingRadiologyRequests: number;
    pendingDiagnosticRequests: number;
    pendingInventoryRequests: number;
    pendingLeaveRequests: number;
    pendingMaintenanceRequests: number;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    resource: string;
    userName: string;
    timestamp: string;
    details?: any;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
    isRead: boolean;
  }>;
}

export interface DepartmentRequestDto {
  id?: string;
  type: 'BED' | 'DOCTOR' | 'STAFF' | 'EQUIPMENT' | 'SUPPLY' | 'PURCHASE' | 'MAINTENANCE';
  title: string;
  description: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY';
  requestedQuantity?: number;
  supportingInfo?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';
  rejectionReason?: string;
  submittedAt?: string;
  updatedAt?: string;
}
