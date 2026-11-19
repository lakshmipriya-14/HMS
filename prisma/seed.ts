import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Aalayam Multispeciality Hospital database seeding...');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ambulanceTrip.deleteMany();
  await prisma.ambulanceDriver.deleteMany();
  await prisma.ambulance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.insuranceClaim.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.medicationAdministration.deleteMany();
  await prisma.nursingTask.deleteMany();
  await prisma.vitalsRecord.deleteMany();
  await prisma.nursingAssignment.deleteMany();
  await prisma.nursingStaff.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.dispensingRecord.deleteMany();
  await prisma.medicineBatch.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.testParameter.deleteMany();
  await prisma.labOrderItem.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.labTest.deleteMany();
  await prisma.radiologyOrder.deleteMany();
  await prisma.radiologyTest.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patientDocument.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctorLeave.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.doctorQualification.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.hospital.deleteMany();

  // 2. Create Roles
  const rolesList = [
    { name: 'SUPER_ADMIN', description: 'Organization Super Administrator' },
    { name: 'HOSPITAL_ADMIN', description: 'Hospital General Administrator' },
    { name: 'DEPARTMENT_ADMIN', description: 'Department Chief Administrator' },
    { name: 'DOCTOR', description: 'Medical Doctor / Surgeon / Specialist' },
    { name: 'NURSE', description: 'Staff Registered Nurse' },
    { name: 'HEAD_NURSE', description: 'Head Nurse / Nursing Supervisor' },
    { name: 'RECEPTIONIST', description: 'Front Desk & Patient Registration' },
    { name: 'LAB_TECHNICIAN', description: 'Laboratory Technician & Pathologist' },
    { name: 'PHARMACIST', description: 'Pharmacist & Dispensary Manager' },
    { name: 'RADIOLOGY_STAFF', description: 'Radiology & Imaging Specialist' },
    { name: 'BILLING_STAFF', description: 'Billing & Cashier Executive' },
    { name: 'INSURANCE_STAFF', description: 'TPA & Health Insurance Officer' },
    { name: 'WARD_MANAGER', description: 'Inpatient Ward & Bed Manager' },
    { name: 'PATIENT', description: 'Registered Patient Portal User' },
    { name: 'AMBULANCE_COORDINATOR', description: 'Emergency Dispatch Coordinator' },
    { name: 'AMBULANCE_DRIVER', description: 'Ambulance Emergency Driver' },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of rolesList) {
    const roleRecord = await prisma.role.create({ data: r });
    roleMap[r.name] = roleRecord.id;
  }
  console.log('✅ Created 16 System Roles');

  // 3. Create Hospital & Branches
  const hospital = await prisma.hospital.create({
    data: {
      name: 'Aalayam Multispeciality Hospital',
      tamilName: 'ஆலயம் பன்னோக்கு மருத்துவமனை',
      code: 'AALAYAM-HQ',
      addressLine1: '45, Ring Road, K.K. Nagar',
      city: 'Madurai',
      state: 'Tamil Nadu',
      postalCode: '625020',
      phone: '+91 452 258 9000',
      emergencyPhone: '+91 452 258 9911',
      email: 'info@aalayamhospital.com',
      website: 'https://aalayamhospital.com',
      licenseNumber: 'TN-HOSP-MDU-2026-0042',
    },
  });

  const branchChennai = await prisma.branch.create({
    data: {
      hospitalId: hospital.id,
      name: 'Aalayam Apex Care - Chennai',
      code: 'AALAYAM-CHN',
      city: 'Chennai',
      address: '120, Velachery Main Road, Guindy, Chennai - 600032',
      phone: '+91 44 2490 8000',
    },
  });

  console.log(`✅ Created Hospital: ${hospital.name} with Chennai branch`);

  // 4. Create Departments
  const deptList = [
    { name: 'Cardiology & Cardiothoracic Surgery', code: 'CARD' },
    { name: 'Neurology & Neurosurgery', code: 'NEUR' },
    { name: 'Orthopaedics & Joint Replacement', code: 'ORTH' },
    { name: 'General Medicine & Diabetology', code: 'MED' },
    { name: 'Paediatrics & Neonatology', code: 'PAED' },
    { name: 'Obstetrics & Gynaecology', code: 'OBGYN' },
    { name: 'Emergency & Trauma Care', code: 'EMER' },
    { name: 'Radiology & Imaging', code: 'RAD' },
    { name: 'Pathology & Laboratory Medicine', code: 'PATH' },
    { name: 'Pharmacy & Therapeutics', code: 'PHARM' },
  ];

  const deptMap: Record<string, string> = {};
  for (const d of deptList) {
    const dept = await prisma.department.create({
      data: {
        hospitalId: hospital.id,
        name: d.name,
        code: d.code,
      },
    });
    deptMap[d.code] = dept.id;
  }
  console.log(`✅ Created ${deptList.length} Hospital Departments`);

  // 5. Default Password Hash: "Password@123"
  const passwordHash = await bcrypt.hash('Password@123', 10);

  // Helper to create user with role
  const createUser = async (
    email: string,
    firstName: string,
    lastName: string,
    roleName: string,
    phone?: string
  ) => {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone: phone || '+91 98400 12345',
        hospitalId: hospital.id,
        userRoles: {
          create: {
            roleId: roleMap[roleName],
          },
        },
      },
    });
    return user;
  };

  // 6. Create Demo Users for all 16 Role Groups
  const superAdmin = await createUser('superadmin@aalayamhospital.com', 'Sundar', 'Ramaswamy', 'SUPER_ADMIN', '+91 98401 00001');
  const hospitalAdmin = await createUser('hospitaladmin@aalayamhospital.com', 'Kalaivani', 'Natarajan', 'HOSPITAL_ADMIN', '+91 98401 00002');
  const deptAdmin = await createUser('departmentadmin@aalayamhospital.com', 'Dr. Radhakrishnan', 'Murugesan', 'DEPARTMENT_ADMIN', '+91 98401 00003');
  const doctorUser = await createUser('doctor@aalayamhospital.com', 'Dr. Senthil', 'Nathan', 'DOCTOR', '+91 98401 00004');
  const doctorUser2 = await createUser('doctor.physician@aalayamhospital.com', 'Dr. Meenakshi', 'Sundaram', 'DOCTOR', '+91 98401 00005');
  const nurseUser = await createUser('nurse@aalayamhospital.com', 'Sister Priya', 'Mary', 'NURSE', '+91 98401 00006');
  const headNurseUser = await createUser('headnurse@aalayamhospital.com', 'Lakshmi', 'Devi', 'HEAD_NURSE', '+91 98401 00007');
  const receptionUser = await createUser('reception@aalayamhospital.com', 'Kavitha', 'Murugan', 'RECEPTIONIST', '+91 98401 00008');
  const labUser = await createUser('lab@aalayamhospital.com', 'Karthik', 'Selvam', 'LAB_TECHNICIAN', '+91 98401 00009');
  const pharmacyUser = await createUser('pharmacy@aalayamhospital.com', 'Ganesh', 'Kumar', 'PHARMACIST', '+91 98401 00010');
  const radiologyUser = await createUser('radiology@aalayamhospital.com', 'Dr. Balamurugan', 'S', 'RADIOLOGY_STAFF', '+91 98401 00011');
  const billingUser = await createUser('billing@aalayamhospital.com', 'Ramesh', 'Kannan', 'BILLING_STAFF', '+91 98401 00012');
  const insuranceUser = await createUser('insurance@aalayamhospital.com', 'Divya', 'Bharathi', 'INSURANCE_STAFF', '+91 98401 00013');
  const wardManagerUser = await createUser('wardmanager@aalayamhospital.com', 'Murugan', 'Pandian', 'WARD_MANAGER', '+91 98401 00014');
  const patientUser = await createUser('patient@aalayamhospital.com', 'Muthuvel', 'Karuppiah', 'PATIENT', '+91 98401 00015');
  const ambCoordUser = await createUser('ambulance@aalayamhospital.com', 'Saravanan', 'G', 'AMBULANCE_COORDINATOR', '+91 98401 00016');
  const driverUser = await createUser('driver@aalayamhospital.com', 'Velu', 'Pandian', 'AMBULANCE_DRIVER', '+91 98401 00017');

  console.log('✅ Created Demo Accounts for ALL 16 Roles (Password: Password@123)');

  // 7. Create Employees & Doctor Profiles
  const empDoctor1 = await prisma.employee.create({
    data: {
      userId: doctorUser.id,
      departmentId: deptMap['CARD'],
      employeeCode: 'EMP-DOC-001',
      designation: 'Senior Consultant Cardiothoracic Surgeon',
      dateOfJoining: new Date('2018-05-15'),
    },
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      employeeId: empDoctor1.id,
      departmentId: deptMap['CARD'],
      designation: 'SURGEON',
      licenseNumber: 'TNMC-2012-45892',
      specialization: 'Interventional Cardiology & Coronary Angioplasty',
      subSpecialization: 'Paediatric Cardiac Surgery',
      experienceYears: 14,
      consultationFee: 800.0,
      followUpFee: 400.0,
      availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      shift: 'MORNING',
      isAvailableToday: true,
      qualifications: {
        create: [
          { degree: 'MBBS', institution: 'Madras Medical College, Chennai', yearPassed: 2010 },
          { degree: 'MS (General Surgery)', institution: 'Stanley Medical College', yearPassed: 2014 },
          { degree: 'MCh (Cardiothoracic Surgery)', institution: 'AIIMS, New Delhi', yearPassed: 2018 },
        ],
      },
    },
  });

  const empDoctor2 = await prisma.employee.create({
    data: {
      userId: doctorUser2.id,
      departmentId: deptMap['MED'],
      employeeCode: 'EMP-DOC-002',
      designation: 'Consultant General Physician & Diabetologist',
      dateOfJoining: new Date('2020-02-10'),
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      employeeId: empDoctor2.id,
      departmentId: deptMap['MED'],
      designation: 'GENERAL_PHYSICIAN',
      licenseNumber: 'TNMC-2015-78234',
      specialization: 'Internal Medicine, Hypertension & Diabetes Management',
      experienceYears: 9,
      consultationFee: 500.0,
      followUpFee: 250.0,
      availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      shift: 'MORNING',
      isAvailableToday: true,
      qualifications: {
        create: [
          { degree: 'MBBS', institution: 'Madurai Medical College', yearPassed: 2015 },
          { degree: 'MD (General Medicine)', institution: 'CMC Vellore', yearPassed: 2019 },
        ],
      },
    },
  });

  // 8. Create Nursing Profiles
  const empNurse = await prisma.employee.create({
    data: {
      userId: nurseUser.id,
      employeeCode: 'EMP-NUR-001',
      designation: 'Staff Registered Nurse',
      dateOfJoining: new Date('2021-08-01'),
    },
  });
  await prisma.nursingStaff.create({
    data: {
      employeeId: empNurse.id,
      isHeadNurse: false,
      shift: 'DAY',
    },
  });

  const empHeadNurse = await prisma.employee.create({
    data: {
      userId: headNurseUser.id,
      employeeCode: 'EMP-NUR-002',
      designation: 'Incharge Nursing Superintendent',
      dateOfJoining: new Date('2016-04-12'),
    },
  });
  await prisma.nursingStaff.create({
    data: {
      employeeId: empHeadNurse.id,
      isHeadNurse: true,
      shift: 'DAY',
    },
  });

  // 9. Create Patients
  const patient1 = await prisma.patient.create({
    data: {
      uhid: 'ALY-2026-0001',
      userId: patientUser.id,
      hospitalId: hospital.id,
      firstName: 'Muthuvel',
      lastName: 'Karuppiah',
      dateOfBirth: new Date('1978-06-15'),
      gender: 'MALE',
      bloodGroup: 'O_POSITIVE',
      phone: '+91 98401 00015',
      email: 'patient@aalayamhospital.com',
      nationalId: 'XXXX-XXXX-8921',
      addressLine1: '14, West Masi Street',
      city: 'Madurai',
      state: 'Tamil Nadu',
      postalCode: '625001',
      emergencyContactName: 'Meena Karuppiah (Wife)',
      emergencyContactPhone: '+91 98401 99999',
      emergencyContactRelation: 'Spouse',
      allergies: ['Penicillin', 'Sulfa Drugs'],
      medicalHistoryNotes: 'Type-2 Diabetes Mellitus (since 2019), Hypertension on Telmisartan 40mg.',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      uhid: 'ALY-2026-0002',
      hospitalId: hospital.id,
      firstName: 'Anitha',
      lastName: 'Venkatesan',
      dateOfBirth: new Date('1992-11-20'),
      gender: 'FEMALE',
      bloodGroup: 'B_POSITIVE',
      phone: '+91 98402 33445',
      addressLine1: '32, Gandhi Road, Anna Nagar',
      city: 'Madurai',
      state: 'Tamil Nadu',
      postalCode: '625020',
      emergencyContactName: 'Venkatesan (Husband)',
      emergencyContactPhone: '+91 98402 33446',
      emergencyContactRelation: 'Spouse',
      allergies: [],
      medicalHistoryNotes: 'Nil significant past medical history.',
    },
  });

  console.log(`✅ Created Patients: ${patient1.firstName} (${patient1.uhid}) & ${patient2.firstName} (${patient2.uhid})`);

  // 10. Create Appointments
  const today = new Date();
  const appointment1 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-0001',
      patientId: patient1.id,
      doctorId: doctor1.id,
      departmentId: deptMap['CARD'],
      appointmentDate: today,
      appointmentTime: '10:00 AM',
      tokenNumber: 1,
      status: 'CHECKED_IN',
      type: 'OPD',
      priority: 'ROUTINE',
      reasonForVisit: 'Exertional chest discomfort and shortness of breath for 1 week',
      consultationFee: 800.0,
      isPaid: true,
      checkInAt: new Date(),
    },
  });

  const appointment2 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-0002',
      patientId: patient2.id,
      doctorId: doctor2.id,
      departmentId: deptMap['MED'],
      appointmentDate: today,
      appointmentTime: '10:30 AM',
      tokenNumber: 2,
      status: 'SCHEDULED',
      type: 'OPD',
      priority: 'ROUTINE',
      reasonForVisit: 'High blood sugar follow up and routine HbA1c review',
      consultationFee: 500.0,
      isPaid: true,
    },
  });

  // 11. Create Consultation & Prescriptions
  const consultation1 = await prisma.consultation.create({
    data: {
      appointmentId: appointment1.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
      chiefComplaint: 'Retrosternal chest tightness radiating to left shoulder on climbing stairs',
      historyOfPresentIllness: 'Symptoms started 7 days ago. Relieved by rest. Associated with diaphoresis.',
      physicalExamNotes: 'BP: 140/90 mmHg, Pulse: 88 bpm regular, S1/S2 heard, no murmurs.',
      diagnosisNotes: 'Unstable Angina Pectoris / Suspected Coronary Artery Disease. Advised immediate Trop-I and ECG.',
      icd10Codes: ['I20.0', 'I25.10'],
      treatmentPlan: 'Initiate dual antiplatelet therapy, statin, and beta blocker. Admission recommended for coronary angiogram.',
      admissionRecommended: true,
    },
  });

  // 12. Create Medicines & Batches
  const med1 = await prisma.medicine.create({
    data: {
      code: 'MED-ASP-75',
      brandName: 'Ecosprin 75',
      genericName: 'Aspirin Gastro-resistant',
      category: 'ANTI_PLATELET',
      strength: '75 mg',
      dosageForm: 'TABLET',
      manufacturer: 'USV Private Limited',
      unitPrice: 5.5,
      currentStock: 2500,
      reorderLevel: 200,
      batches: {
        create: [
          {
            batchNumber: 'BT-ASP-2026A',
            expiryDate: new Date('2028-12-31'),
            quantity: 2500,
            purchasePrice: 3.2,
            sellingPrice: 5.5,
          },
        ],
      },
    },
  });

  const med2 = await prisma.medicine.create({
    data: {
      code: 'MED-ATV-20',
      brandName: 'Atorva 20',
      genericName: 'Atorvastatin Calcium',
      category: 'LIPID_LOWERING',
      strength: '20 mg',
      dosageForm: 'TABLET',
      manufacturer: 'Zydus Cadila',
      unitPrice: 14.0,
      currentStock: 1800,
      reorderLevel: 150,
      batches: {
        create: [
          {
            batchNumber: 'BT-ATV-2026B',
            expiryDate: new Date('2027-10-31'),
            quantity: 1800,
            purchasePrice: 9.0,
            sellingPrice: 14.0,
          },
        ],
      },
    },
  });

  const med3 = await prisma.medicine.create({
    data: {
      code: 'MED-PAN-40',
      brandName: 'Pan 40',
      genericName: 'Pantoprazole Sodium',
      category: 'ANTACID_PPI',
      strength: '40 mg',
      dosageForm: 'TABLET',
      manufacturer: 'Alkem Laboratories',
      unitPrice: 12.0,
      currentStock: 3000,
      reorderLevel: 300,
      batches: {
        create: [
          {
            batchNumber: 'BT-PAN-2026C',
            expiryDate: new Date('2028-06-30'),
            quantity: 3000,
            purchasePrice: 7.5,
            sellingPrice: 12.0,
          },
        ],
      },
    },
  });

  // Prescription
  const prescription1 = await prisma.prescription.create({
    data: {
      prescriptionNumber: 'RX-2026-0001',
      patientId: patient1.id,
      doctorId: doctor1.id,
      consultationId: consultation1.id,
      notes: 'Take medicines strictly after food. Report to emergency if chest pain persists > 15 mins.',
      dispensingStatus: 'PENDING',
      items: {
        create: [
          {
            medicineId: med1.id,
            dosage: '75 mg',
            frequency: '0-1-0 (After Lunch)',
            durationDays: 30,
            instructions: 'Swallow whole with water',
          },
          {
            medicineId: med2.id,
            dosage: '20 mg',
            frequency: '0-0-1 (Bedtime)',
            durationDays: 30,
            instructions: 'Take at night after food',
          },
          {
            medicineId: med3.id,
            dosage: '40 mg',
            frequency: '1-0-0 (Morning)',
            durationDays: 14,
            instructions: 'Take 30 mins before breakfast',
          },
        ],
      },
    },
  });

  console.log(`✅ Created Prescription ${prescription1.prescriptionNumber} with 3 cardiac medications`);

  // 13. Create Wards, Rooms & Beds
  const icuWard = await prisma.ward.create({
    data: {
      hospitalId: hospital.id,
      departmentId: deptMap['CARD'],
      name: 'Intensive Coronary Care Unit (ICCU)',
      code: 'ICCU-01',
      genderAllowed: 'ANY',
      floorNumber: 2,
      totalBeds: 10,
      occupiedBeds: 1,
    },
  });

  const generalWard = await prisma.ward.create({
    data: {
      hospitalId: hospital.id,
      departmentId: deptMap['MED'],
      name: 'General Medical Ward - Male',
      code: 'GWM-01',
      genderAllowed: 'MALE',
      floorNumber: 3,
      totalBeds: 20,
      occupiedBeds: 0,
    },
  });

  const bedICU1 = await prisma.bed.create({
    data: {
      wardId: icuWard.id,
      roomNumber: 'ICU-ROOM-A',
      bedNumber: 'ICCU-01',
      type: 'ICU',
      status: 'OCCUPIED',
      dailyRate: 4500.0,
      currentPatientId: patient1.id,
      currentPatientName: 'Muthuvel Karuppiah',
    },
  });

  await prisma.bed.create({
    data: {
      wardId: icuWard.id,
      roomNumber: 'ICU-ROOM-A',
      bedNumber: 'ICCU-02',
      type: 'ICU',
      status: 'AVAILABLE',
      dailyRate: 4500.0,
    },
  });

  await prisma.bed.create({
    data: {
      wardId: generalWard.id,
      roomNumber: 'GW-301',
      bedNumber: 'BED-301A',
      type: 'STANDARD',
      status: 'AVAILABLE',
      dailyRate: 1200.0,
    },
  });

  // Admission for Patient 1
  const admission1 = await prisma.admission.create({
    data: {
      admissionNumber: 'ADM-2026-0001',
      patientId: patient1.id,
      admittingDoctorId: doctor1.id,
      wardId: icuWard.id,
      bedId: bedICU1.id,
      status: 'ADMITTED',
      admissionReason: 'Acute Coronary Syndrome evaluation & continuous hemodynamic monitoring',
      initialDiagnosis: 'Unstable Angina / Non-STEMI ruled out pending Cardiac Troponin I',
    },
  });

  // Vitals for Admitted Patient
  await prisma.vitalsRecord.create({
    data: {
      patientId: patient1.id,
      admissionId: admission1.id,
      recordedByUserId: nurseUser.id,
      temperature: 98.4,
      systolicBp: 138,
      diastolicBp: 88,
      pulseRate: 82,
      respiratoryRate: 18,
      oxygenSaturation: 98,
      bloodSugarMgDl: 164,
      isAbnormal: true,
      notes: 'Blood pressure slightly elevated. Patient resting comfortably in ICCU Bed 1.',
    },
  });

  // 14. Create Lab Tests Catalogue & Lab Order
  const cbcTest = await prisma.labTest.create({
    data: {
      testCode: 'LAB-CBC',
      name: 'Complete Blood Count (CBC) with Automated Differential',
      category: 'HEMATOLOGY',
      sampleType: 'EDTA Whole Blood',
      price: 450.0,
      tatHours: 4,
      parameters: {
        create: [
          { parameterName: 'Hemoglobin', unit: 'g/dL', referenceLow: 13.0, referenceHigh: 17.0, criticalLow: 7.0 },
          { parameterName: 'Total WBC Count', unit: 'cells/cu.mm', referenceLow: 4000, referenceHigh: 11000, criticalLow: 2000, criticalHigh: 25000 },
          { parameterName: 'Platelet Count', unit: 'lakhs/cu.mm', referenceLow: 1.5, referenceHigh: 4.5, criticalLow: 0.5 },
        ],
      },
    },
  });

  const tropTest = await prisma.labTest.create({
    data: {
      testCode: 'LAB-TROPI',
      name: 'Cardiac Troponin I (High Sensitivity)',
      category: 'BIOCHEMISTRY',
      sampleType: 'Serum',
      price: 1200.0,
      tatHours: 2,
      parameters: {
        create: [
          { parameterName: 'hs-Troponin I', unit: 'ng/mL', referenceLow: 0.0, referenceHigh: 0.04, criticalHigh: 0.1 },
        ],
      },
    },
  });

  const labOrder1 = await prisma.labOrder.create({
    data: {
      orderNumber: 'LAB-2026-0001',
      patientId: patient1.id,
      doctorId: doctor1.id,
      status: 'PROCESSING',
      priority: 'STAT_EMERGENCY',
      barcode: 'BAR-2026001-TROP',
      clinicalNotes: 'Stat troponin I for chest pain rule out',
      orderItems: {
        create: [{ labTestId: tropTest.id }, { labTestId: cbcTest.id }],
      },
    },
  });

  console.log(`✅ Created Lab Order ${labOrder1.orderNumber} (Barcode: ${labOrder1.barcode})`);

  // 15. Create Radiology Tests & Orders
  const radTest1 = await prisma.radiologyTest.create({
    data: {
      testCode: 'RAD-CXR',
      name: 'Chest X-Ray PA View (Digital)',
      modality: 'XRAY',
      price: 600.0,
    },
  });

  await prisma.radiologyOrder.create({
    data: {
      orderNumber: 'RAD-2026-0001',
      patientId: patient1.id,
      doctorId: doctor1.id,
      testId: radTest1.id,
      priority: 'URGENT',
      status: 'SCHEDULED',
      clinicalIndication: 'Assess cardiomegaly, pulmonary congestion or infiltrates.',
    },
  });

  // 16. Create Billing & Invoices
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      patientId: patient1.id,
      admissionId: admission1.id,
      subTotal: 3450.0,
      taxAmount: 0.0,
      discountAmount: 0.0,
      totalAmount: 3450.0,
      paidAmount: 2000.0,
      status: 'PARTIALLY_PAID',
      notes: 'Initial admission deposit received via UPI',
      items: {
        create: [
          { description: 'Consultant Cardiologist Evaluation Fee', category: 'CONSULTATION', quantity: 1, unitPrice: 800.0, totalPrice: 800.0 },
          { description: 'hs-Troponin I Quantitative Lab Assay', category: 'LAB', quantity: 1, unitPrice: 1200.0, totalPrice: 1200.0 },
          { description: 'Chest X-Ray PA Digital', category: 'RADIOLOGY', quantity: 1, unitPrice: 600.0, totalPrice: 600.0 },
          { description: 'ICCU Daily Room & Hemodynamic Nursing Monitoring', category: 'ROOM', quantity: 1, unitPrice: 850.0, totalPrice: 850.0 },
        ],
      },
      payments: {
        create: [
          {
            amount: 2000.0,
            paymentMethod: 'UPI',
            transactionReference: 'UPI-AXIS-99283741',
            receivedByUserId: billingUser.id,
            notes: 'Advance deposit paid at admission desk',
          },
        ],
      },
    },
  });

  console.log(`✅ Created Invoice ${inv1.invoiceNumber} with ₹2000 payment recorded`);

  // 17. Create Ambulance Fleet & Emergency Dispatch
  const ambulance1 = await prisma.ambulance.create({
    data: {
      hospitalId: hospital.id,
      vehicleNumber: 'TN-58-AL-1081',
      model: 'Force Traveller Advance Cardiac Life Support',
      type: 'ADVANCED_LIFE_SUPPORT',
      isAvailable: false,
      currentGpsLat: 9.925201,
      currentGpsLng: 78.119775,
    },
  });

  const empDriver = await prisma.employee.create({
    data: {
      userId: driverUser.id,
      employeeCode: 'EMP-AMB-001',
      designation: 'Certified Emergency Ambulance Driver',
      dateOfJoining: new Date('2022-01-15'),
    },
  });

  const ambDriver = await prisma.ambulanceDriver.create({
    data: {
      employeeId: empDriver.id,
      licenseNumber: 'TN58-2015-DL-88219',
      phone: '+91 98401 00017',
      isOnDuty: true,
    },
  });

  const ambTrip = await prisma.ambulanceTrip.create({
    data: {
      tripCode: 'AMB-2026-0001',
      ambulanceId: ambulance1.id,
      driverId: ambDriver.id,
      callerName: 'Saravanan R',
      callerPhone: '+91 98765 43210',
      pickupLocation: 'Near Meenakshi Amman Temple West Gate, Madurai',
      severity: 'CRITICAL',
      status: 'EN_ROUTE_PICKUP',
      patientConditionSummary: '62-year-old male sudden collapse, dyspnea, responsive to verbal stimuli.',
    },
  });

  console.log(`✅ Created Active Ambulance Dispatch: ${ambTrip.tripCode} (Vehicle: ${ambulance1.vehicleNumber})`);

  // 18. Audit Log
  await prisma.auditLog.create({
    data: {
      hospitalId: hospital.id,
      userId: superAdmin.id,
      userEmail: superAdmin.email,
      userRole: 'SUPER_ADMIN',
      action: 'SEED_INITIALIZE',
      resource: 'SYSTEM',
      details: {
        message: 'Aalayam Multispeciality Hospital HMS initial seed execution completed successfully.',
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log('\n🎉 Aalayam HMS Seeding Completed Successfully!');
  console.log('================================================================');
  console.log('Default Credentials for All Roles:');
  console.log('Password for all users: Password@123\n');
  console.log('1.  SUPER ADMIN:          superadmin@aalayamhospital.com');
  console.log('2.  HOSPITAL ADMIN:       hospitaladmin@aalayamhospital.com');
  console.log('3.  DEPARTMENT ADMIN:     departmentadmin@aalayamhospital.com');
  console.log('4.  DOCTOR (Surgeon):     doctor@aalayamhospital.com');
  console.log('5.  DOCTOR (Physician):   doctor.physician@aalayamhospital.com');
  console.log('6.  STAFF NURSE:          nurse@aalayamhospital.com');
  console.log('7.  HEAD NURSE:           headnurse@aalayamhospital.com');
  console.log('8.  RECEPTIONIST:         reception@aalayamhospital.com');
  console.log('9.  LAB TECHNICIAN:       lab@aalayamhospital.com');
  console.log('10. PHARMACIST:           pharmacy@aalayamhospital.com');
  console.log('11. RADIOLOGY STAFF:      radiology@aalayamhospital.com');
  console.log('12. BILLING STAFF:        billing@aalayamhospital.com');
  console.log('13. INSURANCE STAFF:      insurance@aalayamhospital.com');
  console.log('14. WARD MANAGER:         wardmanager@aalayamhospital.com');
  console.log('15. PATIENT PORTAL:       patient@aalayamhospital.com');
  console.log('16. AMBULANCE DISPATCH:   ambulance@aalayamhospital.com');
  console.log('17. AMBULANCE DRIVER:     driver@aalayamhospital.com');
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
