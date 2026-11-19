import {
  AdmissionStatus,
  AppointmentStatus,
  AppointmentType,
  BedStatus,
  BedType,
  BloodGroup,
  ClaimStatus,
  ConsultationStatus,
  DispensingStatus,
  DoctorDesignation,
  EmergencySeverity,
  Gender,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  Priority,
  RadiologyStatus,
  Role,
  SampleStatus,
  TripStatus,
} from '@multispeciality-hms/contracts';

export interface BaseEntity {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

export interface Hospital extends BaseEntity {
  name: string;
  code: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  licenseNumber: string;
  isActive: boolean;
}

export interface Branch extends BaseEntity {
  hospitalId: string;
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export interface Department extends BaseEntity {
  hospitalId: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartmentId?: string;
  isActive: boolean;
}

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  hospitalId?: string;
  branchId?: string;
  roles: Role[];
}

export interface Doctor extends BaseEntity {
  userId: string;
  employeeId: string;
  user?: User;
  departmentId: string;
  department?: Department;
  designation: DoctorDesignation;
  licenseNumber: string;
  specialization: string;
  subSpecialization?: string;
  qualifications: string[];
  experienceYears: number;
  consultationFee: number;
  followUpFee: number;
  opdFee: number;
  ipdAvailable: boolean;
  consultationDurationMinutes: number;
  availableDays: string[];
  shift: string;
  isAvailableToday: boolean;
}

export interface Patient extends BaseEntity {
  uhid: string;
  userId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | Date;
  gender: Gender;
  bloodGroup?: BloodGroup;
  phone: string;
  email?: string;
  nationalId?: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  allergies: string[];
  medicalHistoryNotes?: string;
  hospitalId: string;
}

export interface Appointment extends BaseEntity {
  appointmentNumber: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  departmentId: string;
  department?: Department;
  hospitalId: string;
  appointmentDate: string;
  appointmentTime: string;
  tokenNumber: number;
  status: AppointmentStatus;
  type: AppointmentType;
  priority: Priority;
  reasonForVisit: string;
  consultationFee: number;
  isPaid: boolean;
}

export interface Consultation extends BaseEntity {
  appointmentId: string;
  appointment?: Appointment;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  physicalExaminationNotes?: string;
  diagnosisNotes: string;
  icd10Codes: string[];
  treatmentPlan: string;
  followUpDate?: string;
  status: ConsultationStatus;
  admissionRecommended: boolean;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
  route?: string;
  dispensedQuantity?: number;
}

export interface Prescription extends BaseEntity {
  prescriptionNumber: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  consultationId?: string;
  notes?: string;
  dispensingStatus: DispensingStatus;
  items: PrescriptionItem[];
}

export interface VitalsRecord extends BaseEntity {
  patientId: string;
  admissionId?: string;
  recordedByUserId: string;
  recordedByName?: string;
  temperature?: number;
  systolicBp?: number;
  diastolicBp?: number;
  pulseRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  bloodSugarMgDl?: number;
  weightKg?: number;
  heightCm?: number;
  isAbnormal: boolean;
  notes?: string;
}

export interface NursingTask extends BaseEntity {
  patientId: string;
  patient?: Patient;
  admissionId: string;
  assignedNurseId?: string;
  assignedNurseName?: string;
  taskTitle: string;
  taskDescription: string;
  dueTime: string | Date;
  isCompleted: boolean;
  completedAt?: string | Date;
  priority: Priority;
}

export interface LabTestCatalogueItem extends BaseEntity {
  testCode: string;
  testName: string;
  category: string;
  sampleType: string;
  price: number;
  tatHours: number;
  referenceRanges: {
    parameter: string;
    low: number;
    high: number;
    unit: string;
    criticalLow?: number;
    criticalHigh?: number;
  }[];
}

export interface LabOrder extends BaseEntity {
  orderNumber: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  status: SampleStatus;
  barcode: string;
  priority: Priority;
  tests: {
    testId: string;
    testName: string;
    results?: {
      parameter: string;
      value: string;
      unit: string;
      referenceRange: string;
      isCritical: boolean;
    }[];
  }[];
  reportReleasedAt?: string | Date;
}

export interface Medicine extends BaseEntity {
  code: string;
  brandName: string;
  genericName: string;
  category: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  unitPrice: number;
  currentStock: number;
  reorderLevel: number;
}

export interface MedicineBatch extends BaseEntity {
  medicineId: string;
  batchNumber: string;
  expiryDate: string | Date;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
}

export interface Ward extends BaseEntity {
  hospitalId: string;
  name: string;
  code: string;
  genderAllowed: 'MALE' | 'FEMALE' | 'ANY';
  floorNumber: number;
  totalBeds: number;
  occupiedBeds: number;
}

export interface Bed extends BaseEntity {
  wardId: string;
  roomNumber: string;
  bedNumber: string;
  type: BedType;
  status: BedStatus;
  dailyRate: number;
  currentPatientId?: string;
  currentPatientName?: string;
}

export interface Admission extends BaseEntity {
  admissionNumber: string;
  patientId: string;
  patient?: Patient;
  admittingDoctorId: string;
  admittingDoctor?: Doctor;
  wardId: string;
  bedId: string;
  bed?: Bed;
  status: AdmissionStatus;
  admittedAt: string | Date;
  dischargedAt?: string | Date;
  admissionReason: string;
  diagnosisNotes: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  patientId: string;
  patient?: Patient;
  admissionId?: string;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
}

export interface InsuranceClaim extends BaseEntity {
  claimNumber: string;
  invoiceId: string;
  patientId: string;
  patient?: Patient;
  providerName: string;
  policyNumber: string;
  claimAmount: number;
  approvedAmount?: number;
  status: ClaimStatus;
}

export interface AmbulanceTrip extends BaseEntity {
  tripCode: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  callerName: string;
  callerPhone: string;
  pickupLocation: string;
  severity: EmergencySeverity;
  status: TripStatus;
  patientConditionSummary: string;
  hospitalHandoverNotes?: string;
}

export interface NotificationItem extends BaseEntity {
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl?: string;
}

export interface AuditLogItem extends BaseEntity {
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}
