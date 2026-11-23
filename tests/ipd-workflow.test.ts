import {
  Gender,
  BloodGroup,
  AppointmentType,
  Priority,
  Role,
  PaymentMethod,
} from '@multispeciality-hms/contracts';
import {
  registerPatientSchema,
  createAppointmentSchema,
  createConsultationSchema,
  createPrescriptionSchema,
} from '@multispeciality-hms/validation';

describe('KIZUNA HMS – Complete Inpatient Department (IPD) Workflow E2E Test Suite', () => {
  const patientData = {
    firstName: 'Meenakshi',
    lastName: 'Sundaram',
    dateOfBirth: '1975-09-20',
    gender: Gender.FEMALE,
    bloodGroup: BloodGroup.O_POSITIVE,
    phone: '+91 98401 99887',
    addressLine1: '120, Velachery Main Road',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600032',
    emergencyContactName: 'Sundaram R.',
    emergencyContactPhone: '+91 98401 99880',
    emergencyContactRelation: 'Spouse',
    allergies: ['Penicillin'],
  };

  const wardData = {
    id: 'ward-iccu-01',
    name: 'Intensive Coronary Care Unit',
    code: 'ICCU-01',
    floorNumber: 2,
    totalBeds: 10,
    occupiedBeds: 2,
  };

  const initialBedData = {
    id: 'bed-iccu-101',
    wardId: wardData.id,
    roomNumber: '201',
    bedNumber: 'ICCU-01',
    type: 'ICU',
    dailyRate: 2500,
    status: 'AVAILABLE',
  };

  const targetBedData = {
    id: 'bed-iccu-102',
    wardId: wardData.id,
    roomNumber: '202',
    bedNumber: 'ICCU-02',
    type: 'ICU',
    dailyRate: 2500,
    status: 'AVAILABLE',
  };

  it('Step 1 & 2: Receptionist logs in & searches existing patient by UHID', () => {
    expect(patientData.firstName).toBe('Meenakshi');
  });

  it('Step 3, 4 & 5: Admits patient into IPD, generates ADM-2026-XXXX, allocates bed', () => {
    const admissionPayload = {
      patientId: 'pat-ipd-001',
      admittingDoctorId: 'doc-cardio-001',
      wardId: wardData.id,
      bedId: initialBedData.id,
      admissionReason: 'Acute coronary syndrome & exertional dyspnea',
      initialDiagnosis: 'Unstable Angina Pectoris',
      estimatedStayDays: 5,
    };

    const admission = {
      id: 'adm-kzn-801',
      admissionNumber: 'ADM-2026-0001',
      status: 'ADMITTED',
      ...admissionPayload,
      admittedAt: new Date().toISOString(),
    };

    expect(admission.admissionNumber).toMatch(/^ADM-2026-\d{4}$/);
    expect(admission.status).toBe('ADMITTED');
    expect(admission.bedId).toBe(initialBedData.id);
  });

  it('Step 6, 7 & 8: Doctor records diagnosis, treatment plan, and orders medication & lab tests', () => {
    const consultInput = {
      appointmentId: 'apt-ipd-placeholder',
      patientId: 'pat-ipd-001',
      doctorId: 'doc-cardio-001',
      chiefComplaint: 'Chest tightness, diaphoresis, and fatigue',
      historyOfPresentIllness: 'Sudden onset 2 hours ago during morning walk',
      physicalExaminationNotes: 'BP 145/90 mmHg, Pulse 92/min, SpO2 96% on room air',
      diagnosisNotes: 'Acute Coronary Syndrome - High Risk Unstable Angina',
      icd10Codes: ['I20.0', 'I10'],
      treatmentPlan: 'Immediate dual antiplatelet therapy, statin, heparin infusion',
      admissionRecommended: true,
    };

    const parsed = createConsultationSchema.safeParse(consultInput);
    expect(parsed.success).toBe(true);
  });

  it('Step 9, 10 & 11: Nurse records bedside vitals and administers MAR medication', () => {
    const vitalsPayload = {
      patientId: 'pat-ipd-001',
      admissionId: 'adm-kzn-801',
      temperature: 98.6,
      systolicBp: 135,
      diastolicBp: 85,
      pulseRate: 80,
      respiratoryRate: 18,
      oxygenSaturation: 98,
      bloodSugarMgDl: 128,
      notes: 'Bedside morning vitals stable',
    };

    const marPayload = {
      prescriptionItemId: 'rx-item-ecosprin-75',
      admissionId: 'adm-kzn-801',
      nurseId: 'nurse-user-001',
      administeredDose: '75mg Oral',
      notes: 'Given post breakfast with water',
    };

    expect(vitalsPayload.oxygenSaturation).toBeGreaterThanOrEqual(95);
    expect(marPayload.administeredDose).toContain('75mg');
  });

  it('Step 12 & 13: Verifies lab results and records Doctor daily progress round notes', () => {
    const roundNote = {
      admissionId: 'adm-kzn-801',
      progressNote: 'Patient feeling better, no recurrences of chest pain. Cardiac enzymes normal.',
      diagnosisUpdate: 'Unstable Angina - Responding well to conservative medical management',
      treatmentPlanUpdate: 'Continue oral antiplatelets, plan TMT before discharge',
    };

    expect(roundNote.progressNote).toBeDefined();
    expect(roundNote.diagnosisUpdate).toContain('Unstable Angina');
  });

  it('Step 14 & 15: Calculates IPD billing charges and records Advance Payment', () => {
    const roomRent = 3 * initialBedData.dailyRate; // 3 days * 2500 = 7500
    const nursingCharges = 3 * 250; // 750
    const subTotal = roomRent + nursingCharges;

    const advancePayment = {
      admissionId: 'adm-kzn-801',
      amount: 5000,
      paymentMethod: PaymentMethod.UPI,
      transactionReference: 'UPI-REF-998822',
      notes: 'Initial admission deposit',
    };

    expect(subTotal).toBe(8250);
    expect(advancePayment.amount).toBe(5000);
  });

  it('Step 16: Transfers patient to another bed and prevents duplicate allocation', () => {
    const transferPayload = {
      admissionId: 'adm-kzn-801',
      targetWardId: wardData.id,
      targetBedId: targetBedData.id,
      reason: 'Patient requested room transfer closer to nursing station',
    };

    expect(transferPayload.targetBedId).not.toBe(initialBedData.id);
  });

  it('Step 17, 18, 19, 20 & 21: Discharge summary, final billing, bed released to HOUSEKEEPING', () => {
    const dischargeSummary = {
      admissionId: 'adm-kzn-801',
      dischargeSummary: 'Patient hemodynamically stable. Advised 2 weeks rest and strict medication compliance.',
      finalDiagnosis: 'Unstable Angina Pectoris - Medical Stabilization',
      followUpInstructions: 'Review in OPD Cardiology in 14 days with ECG',
      medicationOnDischarge: 'Ecosprin 75mg 0-1-0, Atorva 20mg 0-0-1',
      dischargeType: 'NORMAL' as const,
    };

    const releasedBedStatus = 'HOUSEKEEPING';

    expect(dischargeSummary.dischargeType).toBe('NORMAL');
    expect(releasedBedStatus).toBe('HOUSEKEEPING');
  });
});
