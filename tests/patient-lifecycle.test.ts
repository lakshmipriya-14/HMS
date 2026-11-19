import {
  Gender,
  BloodGroup,
  AppointmentType,
  Priority,
  PaymentMethod,
} from '@multispeciality-hms/contracts';
import {
  registerPatientSchema,
  createAppointmentSchema,
  createConsultationSchema,
  createPrescriptionSchema,
  createInvoiceSchema,
} from '@multispeciality-hms/validation';

describe('Aalayam HMS - Cross-Module Integrated Patient Journey', () => {
  it('Phase 1: Validates Patient Registration at Reception', () => {
    const patientInput = {
      firstName: 'Karthik',
      lastName: 'Ramanathan',
      dateOfBirth: '1988-04-12',
      gender: Gender.MALE,
      bloodGroup: BloodGroup.A_POSITIVE,
      phone: '+91 98402 77889',
      addressLine1: '88, Pandian Street',
      city: 'Madurai',
      state: 'Tamil Nadu',
      postalCode: '625001',
      emergencyContactName: 'Geetha Ramanathan',
      emergencyContactPhone: '+91 98402 77880',
      emergencyContactRelation: 'Spouse',
      allergies: ['Aspirin'],
    };

    const result = registerPatientSchema.safeParse(patientInput);
    expect(result.success).toBe(true);
  });

  it('Phase 2: Validates Appointment Booking & Slot Assignment', () => {
    const aptInput = {
      patientId: 'patient-uuid-001',
      doctorId: 'doctor-uuid-001',
      departmentId: 'dept-cardiology-001',
      appointmentDate: '2026-11-20',
      appointmentTime: '10:30 AM',
      appointmentType: AppointmentType.OPD,
      reasonForVisit: 'Chest pain review',
      priority: Priority.ROUTINE,
    };

    const result = createAppointmentSchema.safeParse(aptInput);
    expect(result.success).toBe(true);
  });

  it('Phase 3: Validates Doctor Consultation & Clinical Encounter', () => {
    const consultInput = {
      appointmentId: 'apt-uuid-001',
      patientId: 'patient-uuid-001',
      doctorId: 'doctor-uuid-001',
      chiefComplaint: 'Exertional angina and palpitation',
      diagnosisNotes: 'Coronary Artery Disease - Stable Angina',
      treatmentPlan: 'Initiate beta blockers and anti-anginal medications',
      admissionRecommended: false,
    };

    const result = createConsultationSchema.safeParse(consultInput);
    expect(result.success).toBe(true);
  });

  it('Phase 4: Validates Digital Prescription Generation', () => {
    const rxInput = {
      patientId: 'patient-uuid-001',
      doctorId: 'doctor-uuid-001',
      items: [
        {
          medicineId: 'med-001',
          medicineName: 'Atorva 20mg',
          dosage: '20mg',
          frequency: '0-0-1 (Bedtime)',
          durationDays: 30,
          instructions: 'After dinner',
          route: 'Oral',
        },
      ],
    };

    const result = createPrescriptionSchema.safeParse(rxInput);
    expect(result.success).toBe(true);
  });

  it('Phase 5: Validates Multi-Item Hospital Invoice Generation', () => {
    const invoiceInput = {
      patientId: 'patient-uuid-001',
      items: [
        {
          description: 'Consultant Cardiologist Evaluation',
          category: 'CONSULTATION' as const,
          quantity: 1,
          unitPrice: 800,
          discountPercentage: 0,
        },
        {
          description: 'High-Sensitivity Troponin I',
          category: 'LAB' as const,
          quantity: 1,
          unitPrice: 1200,
          discountPercentage: 0,
        },
      ],
      taxPercentage: 0,
      discountAmount: 0,
    };

    const result = createInvoiceSchema.safeParse(invoiceInput);
    expect(result.success).toBe(true);
  });
});
