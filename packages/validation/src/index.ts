import { z } from 'zod';
import {
  AdmissionStatus,
  AppointmentStatus,
  AppointmentType,
  BedStatus,
  BedType,
  BloodGroup,
  ClaimStatus,
  DoctorDesignation,
  EmergencySeverity,
  Gender,
  PaymentMethod,
  Priority,
  Role,
} from '@multispeciality-hms/contracts';

// Auth Validation Schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Patient Registration Schema
export const registerPatientSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  gender: z.nativeEnum(Gender),
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  nationalId: z.string().optional(),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(5, 'Valid postal code is required'),
  country: z.string().default('India'),
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(10, 'Valid emergency contact phone is required'),
  emergencyContactRelation: z.string().min(2, 'Relation is required'),
  allergies: z.array(z.string()).default([]),
  medicalHistoryNotes: z.string().optional(),
  hospitalId: z.string().uuid().optional(),
});
export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;

// Appointment Booking Schema
export const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  departmentId: z.string().min(1, 'Department is required'),
  hospitalId: z.string().optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  appointmentTime: z.string().min(4, 'Appointment time is required'),
  appointmentType: z.nativeEnum(AppointmentType).default(AppointmentType.OPD),
  reasonForVisit: z.string().min(3, 'Reason for visit must be specified'),
  priority: z.nativeEnum(Priority).default(Priority.ROUTINE),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

// Clinical Consultation Schema
export const createConsultationSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  chiefComplaint: z.string().min(3, 'Chief complaint is required'),
  historyOfPresentIllness: z.string().optional(),
  physicalExaminationNotes: z.string().optional(),
  diagnosisNotes: z.string().min(2, 'Diagnosis notes are required'),
  icd10Codes: z.array(z.string()).default([]),
  treatmentPlan: z.string().min(3, 'Treatment plan is required'),
  followUpDate: z.string().optional(),
  admissionRecommended: z.boolean().default(false),
  admissionDepartmentId: z.string().optional(),
  admissionWardId: z.string().optional(),
  admissionNotes: z.string().optional(),
});
export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;

// Prescription Schema
export const prescriptionItemSchema = z.object({
  medicineId: z.string().min(1, 'Medicine is required'),
  medicineName: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g., 500mg)'),
  frequency: z.string().min(1, 'Frequency is required (e.g., 1-0-1 or TID)'),
  durationDays: z.number().int().positive('Duration must be greater than 0'),
  instructions: z.string().min(1, 'Instructions required (e.g., After food)'),
  route: z.string().default('Oral'),
});

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  consultationId: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one medicine must be prescribed'),
});
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

// Nursing Vitals Schema
export const recordVitalsSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  admissionId: z.string().optional(),
  temperature: z.number().min(80).max(115).optional(), // Fahrenheit
  systolicBp: z.number().min(50).max(300).optional(),
  diastolicBp: z.number().min(30).max(200).optional(),
  pulseRate: z.number().min(30).max(250).optional(),
  respiratoryRate: z.number().min(5).max(60).optional(),
  oxygenSaturation: z.number().min(50).max(100).optional(),
  bloodSugarMgDl: z.number().min(20).max(800).optional(),
  weightKg: z.number().min(0.5).max(350).optional(),
  heightCm: z.number().min(20).max(250).optional(),
  notes: z.string().optional(),
});
export type RecordVitalsInput = z.infer<typeof recordVitalsSchema>;

// Laboratory Order Schema
export const createLabOrderSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  testIds: z.array(z.string()).min(1, 'Select at least one laboratory test'),
  priority: z.nativeEnum(Priority).default(Priority.ROUTINE),
  clinicalNotes: z.string().optional(),
});
export type CreateLabOrderInput = z.infer<typeof createLabOrderSchema>;

// Laboratory Results Entry
export const enterLabResultsSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  results: z.array(
    z.object({
      testParameterId: z.string(),
      measuredValue: z.string().min(1, 'Value required'),
      unit: z.string(),
      referenceRange: z.string(),
      isAbnormal: z.boolean().default(false),
      isCritical: z.boolean().default(false),
      remarks: z.string().optional(),
    })
  ).min(1, 'At least one result value is required'),
  technicianNotes: z.string().optional(),
});
export type EnterLabResultsInput = z.infer<typeof enterLabResultsSchema>;

// Pharmacy Dispense Schema
export const dispensePrescriptionSchema = z.object({
  prescriptionId: z.string().min(1, 'Prescription ID is required'),
  items: z.array(
    z.object({
      prescriptionItemId: z.string().min(1),
      batchId: z.string().min(1, 'Batch must be selected'),
      dispensedQuantity: z.number().int().positive('Quantity must be greater than 0'),
    })
  ).min(1, 'Dispensing items required'),
  dispensingNotes: z.string().optional(),
});
export type DispensePrescriptionInput = z.infer<typeof dispensePrescriptionSchema>;

// Billing Invoice Schema
export const createInvoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  admissionId: z.string().optional(),
  appointmentId: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(2, 'Description required'),
      category: z.enum(['CONSULTATION', 'LAB', 'RADIOLOGY', 'PHARMACY', 'ROOM', 'PROCEDURE']),
      quantity: z.number().int().positive(),
      unitPrice: z.number().nonnegative(),
      discountPercentage: z.number().min(0).max(100).default(0),
    })
  ).min(1, 'Invoice must have at least one line item'),
  taxPercentage: z.number().min(0).max(50).default(0),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const collectPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});
export type CollectPaymentInput = z.infer<typeof collectPaymentSchema>;

// Ward & Bed Admission Schema
export const admitPatientSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  admittingDoctorId: z.string().min(1, 'Doctor is required'),
  wardId: z.string().min(1, 'Ward is required'),
  bedId: z.string().min(1, 'Bed is required'),
  admissionReason: z.string().min(3, 'Reason for admission required'),
  initialDiagnosis: z.string().min(2, 'Initial diagnosis required'),
  estimatedStayDays: z.number().int().positive().optional(),
});
export type AdmitPatientInput = z.infer<typeof admitPatientSchema>;

// Ambulance Emergency Request Schema
export const createAmbulanceRequestSchema = z.object({
  callerName: z.string().min(2, 'Caller name is required'),
  callerPhone: z.string().min(10, 'Valid 10-digit caller phone is required'),
  pickupLocation: z.string().min(5, 'Exact pickup location address is required'),
  emergencySeverity: z.nativeEnum(EmergencySeverity).default(EmergencySeverity.CRITICAL),
  patientConditionSummary: z.string().min(3, 'Patient emergency condition is required'),
  patientId: z.string().optional(),
});
export type CreateAmbulanceRequestInput = z.infer<typeof createAmbulanceRequestSchema>;
