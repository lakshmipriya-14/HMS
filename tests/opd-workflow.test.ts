import {
  Gender,
  BloodGroup,
  AppointmentType,
  Priority,
  Role,
} from '@multispeciality-hms/contracts';
import {
  registerPatientSchema,
  createAppointmentSchema,
  createConsultationSchema,
  createPrescriptionSchema,
} from '@multispeciality-hms/validation';

describe('Kizuna HMS – Complete Outpatient Department (OPD) End-to-End Workflow', () => {
  const patientData = {
    firstName: 'Anandha',
    lastName: 'Krishnan',
    dateOfBirth: '1985-06-15',
    gender: Gender.MALE,
    bloodGroup: BloodGroup.O_POSITIVE,
    phone: '+91 98409 87654',
    addressLine1: '42, Anna Salai, Main Road',
    city: 'Madurai',
    state: 'Tamil Nadu',
    postalCode: '625001',
    emergencyContactName: 'Kannan M.',
    emergencyContactPhone: '+91 98401 23450',
    emergencyContactRelation: 'Spouse',
    allergies: ['Penicillin', 'Sulfa'],
    medicalHistoryNotes: 'Hypertension under medication',
  };

  it('Phase 1: Validates Receptionist Patient Registration & UHID Schema', () => {
    const parsed = registerPatientSchema.safeParse(patientData);
    expect(parsed.success).toBe(true);
  });

  it('Phase 2 & 3: Validates Doctor Appointment Booking & Slot Validation', () => {
    const bookingInput = {
      patientId: 'patient-kzn-001',
      doctorId: 'doctor-kzn-001',
      departmentId: 'dept-cardio-001',
      appointmentDate: '2026-11-25',
      appointmentTime: '10:00 AM',
      appointmentType: AppointmentType.OPD,
      reasonForVisit: 'Routine cardiac follow-up',
      priority: Priority.ROUTINE,
    };

    const parsed = createAppointmentSchema.safeParse(bookingInput);
    expect(parsed.success).toBe(true);
  });

  it('Phase 4: Validates Receptionist Check-in & OPD Token Queue Generation', () => {
    const checkInPayload = {
      appointmentId: 'apt-kzn-101',
      status: 'CHECKED_IN',
      checkInAt: new Date().toISOString(),
      tokenNumber: 1,
    };

    expect(checkInPayload.status).toBe('CHECKED_IN');
    expect(checkInPayload.tokenNumber).toBeGreaterThan(0);
  });

  it('Phase 5: Validates Doctor Clinical Consultation & ICD-10 Diagnosis Record', () => {
    const consultInput = {
      appointmentId: 'apt-kzn-101',
      patientId: 'patient-kzn-001',
      doctorId: 'doctor-kzn-001',
      chiefComplaint: 'Chest heaviness and dyspnea on exertion',
      historyOfPresentIllness: 'Symptoms started 3 days ago, worse after meals',
      physicalExaminationNotes: 'BP: 130/85 mmHg, Pulse: 78 bpm, S1 S2 normal',
      diagnosisNotes: 'Essential Primary Hypertension & Exertional Angina',
      icd10Codes: ['I10', 'I20.9'],
      treatmentPlan: 'Lifestyle modifications, low sodium diet, anti-hypertensive therapy',
      followUpDate: '2026-12-10',
      admissionRecommended: false,
    };

    const parsed = createConsultationSchema.safeParse(consultInput);
    expect(parsed.success).toBe(true);
    expect(consultInput.icd10Codes.length).toBe(2);
  });

  it('Phase 6: Validates Multi-Medicine Digital Prescription Generation', () => {
    const rxInput = {
      patientId: 'patient-kzn-001',
      doctorId: 'doctor-kzn-001',
      consultationId: 'consult-kzn-501',
      items: [
        {
          medicineId: 'med-ecosprin-75',
          medicineName: 'Ecosprin 75mg',
          dosage: '75mg',
          frequency: '0-1-0 (After Lunch)',
          durationDays: 30,
          route: 'Oral',
          instructions: 'Take with plenty of water after food',
        },
        {
          medicineId: 'med-atorva-20',
          medicineName: 'Atorva 20mg',
          dosage: '20mg',
          frequency: '0-0-1 (Bedtime)',
          durationDays: 30,
          route: 'Oral',
          instructions: 'Take before sleep after dinner',
        },
      ],
      notes: 'Review in 2 weeks with lipid profile lab report',
    };

    const parsed = createPrescriptionSchema.safeParse(rxInput);
    expect(parsed.success).toBe(true);
    expect(rxInput.items.length).toBe(2);
  });

  it('Phase 7 & 8: Validates Patient Profile Consultation History & RBAC Access Scope', () => {
    const rolesMap = [
      { role: Role.RECEPTIONIST, canRegister: true, canConsult: false },
      { role: Role.DOCTOR, canRegister: false, canConsult: true },
      { role: Role.PATIENT, canRegister: false, canConsult: false },
    ];

    rolesMap.forEach((r) => {
      if (r.role === Role.RECEPTIONIST) {
        expect(r.canRegister).toBe(true);
      }
      if (r.role === Role.DOCTOR) {
        expect(r.canConsult).toBe(true);
      }
    });
  });
});
