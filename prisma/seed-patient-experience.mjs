import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding rich patient experience and doctor data...');

  const hospital = await prisma.hospital.findFirst({ where: { code: 'UYIRINAI' } });
  if (!hospital) throw new Error('Hospital UYIRINAI not found. Run main seed first.');

  const branch = await prisma.branch.findFirst({ where: { hospitalId: hospital.id, code: 'MAIN' } });
  if (!branch) throw new Error('Branch MAIN not found.');

  // 1. Ensure Departments exist
  const deptData = [
    { code: 'GENMED', name: 'General Medicine', description: 'Primary and internal care for adults' },
    { code: 'CARD', name: 'Cardiology', description: 'Comprehensive heart and cardiovascular care' },
    { code: 'PED', name: 'Pediatrics', description: 'Specialized care for infants, children, and teens' },
    { code: 'ORTHO', name: 'Orthopedics', description: 'Musculoskeletal and joint disorders' },
    { code: 'NEURO', name: 'Neurology', description: 'Brain, spinal cord, and nervous system disorders' },
  ];

  const depts = {};
  for (const d of deptData) {
    const row = await prisma.department.upsert({
      where: { hospitalId_code: { hospitalId: hospital.id, code: d.code } },
      update: { name: d.name, description: d.description, branchId: branch.id },
      create: { hospitalId: hospital.id, branchId: branch.id, code: d.code, name: d.name, description: d.description },
    });
    depts[d.code] = row;
  }

  const doctorRole = await prisma.role.findFirst({ where: { name: 'DOCTOR' } });
  const patientRole = await prisma.role.findFirst({ where: { name: 'PATIENT' } });
  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 2. Ensure 5 distinct Doctors
  const doctorFixtures = [
    {
      email: 'dr.arun@uyirinai.com',
      firstName: 'Arun',
      lastName: 'Kumar',
      phone: '+919876500101',
      deptCode: 'GENMED',
      designation: 'GENERAL_PHYSICIAN',
      specialization: 'General Medicine',
      experienceYears: 12,
      gender: 'MALE',
      consultationFee: 500,
      bio: 'Senior Consultant in Internal Medicine with 12+ years of clinical experience in preventative health, diabetes management, and chronic illness care.',
      qualifications: [{ degree: 'MBBS', institution: 'Madras Medical College' }, { degree: 'MD - General Medicine', institution: 'AIIMS New Delhi' }],
      schedules: [
        { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '13:00' },
        { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '13:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '13:00' },
        { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '13:00' },
        { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '13:00' },
        { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '13:00' },
      ],
    },
    {
      email: 'dr.priya@uyirinai.com',
      firstName: 'Priya',
      lastName: 'Soundararajan',
      phone: '+919876500102',
      deptCode: 'CARD',
      designation: 'SPECIALIST',
      specialization: 'Cardiology',
      experienceYears: 16,
      gender: 'FEMALE',
      consultationFee: 800,
      bio: 'Lead Interventional Cardiologist specializing in hypertension, ischemic heart disease, preventive cardiology, and non-invasive cardiac imaging.',
      qualifications: [{ degree: 'MBBS', institution: 'Stanley Medical College' }, { degree: 'MD - Medicine', institution: 'JIPMER' }, { degree: 'DM - Cardiology', institution: 'Sri Ramachandra Institute' }],
      schedules: [
        { dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '16:00' },
        { dayOfWeek: 'TUESDAY', startTime: '10:00', endTime: '16:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '10:00', endTime: '16:00' },
        { dayOfWeek: 'THURSDAY', startTime: '10:00', endTime: '16:00' },
        { dayOfWeek: 'FRIDAY', startTime: '10:00', endTime: '16:00' },
      ],
    },
    {
      email: 'dr.rajeshwari@uyirinai.com',
      firstName: 'Rajeshwari',
      lastName: 'Venkataraman',
      phone: '+919876500103',
      deptCode: 'PED',
      designation: 'SPECIALIST',
      specialization: 'Pediatrics',
      experienceYears: 9,
      gender: 'FEMALE',
      consultationFee: 600,
      bio: 'Compassionate Consultant Pediatrician devoted to child wellness, immunization regimens, neonatal care, and adolescent development.',
      qualifications: [{ degree: 'MBBS', institution: 'Madurai Medical College' }, { degree: 'DCH', institution: 'Institute of Child Health' }, { degree: 'DNB - Pediatrics', institution: 'Apollo Hospitals' }],
      schedules: [
        { dayOfWeek: 'MONDAY', startTime: '08:30', endTime: '12:30' },
        { dayOfWeek: 'TUESDAY', startTime: '08:30', endTime: '12:30' },
        { dayOfWeek: 'WEDNESDAY', startTime: '08:30', endTime: '12:30' },
        { dayOfWeek: 'THURSDAY', startTime: '08:30', endTime: '12:30' },
        { dayOfWeek: 'FRIDAY', startTime: '08:30', endTime: '12:30' },
        { dayOfWeek: 'SATURDAY', startTime: '08:30', endTime: '12:30' },
      ],
    },
    {
      email: 'dr.suresh@uyirinai.com',
      firstName: 'Suresh',
      lastName: 'Ramanathan',
      phone: '+919876500104',
      deptCode: 'ORTHO',
      designation: 'SPECIALIST',
      specialization: 'Orthopedics',
      experienceYears: 18,
      gender: 'MALE',
      consultationFee: 900,
      bio: 'Chief Orthopedic Surgeon with 18+ years in arthroscopic surgery, total knee and hip arthroplasty, and complex trauma reconstruction.',
      qualifications: [{ degree: 'MBBS', institution: 'Kilpauk Medical College' }, { degree: 'MS - Orthopedics', institution: 'CMC Vellore' }, { degree: 'Fellowship Joint Replacement', institution: 'NHS UK' }],
      schedules: [
        { dayOfWeek: 'TUESDAY', startTime: '11:00', endTime: '17:00' },
        { dayOfWeek: 'THURSDAY', startTime: '11:00', endTime: '17:00' },
        { dayOfWeek: 'SATURDAY', startTime: '11:00', endTime: '17:00' },
      ],
    },
    {
      email: 'dr.karthik@uyirinai.com',
      firstName: 'Karthik',
      lastName: 'Subramanian',
      phone: '+919876500105',
      deptCode: 'NEURO',
      designation: 'SPECIALIST',
      specialization: 'Neurology',
      experienceYears: 14,
      gender: 'MALE',
      consultationFee: 1000,
      bio: 'Senior Neurologist with expertise in stroke management, epilepsy, neuromuscular disorders, Parkinsonism, and chronic migraine therapies.',
      qualifications: [{ degree: 'MBBS', institution: 'PSG Institute of Medical Sciences' }, { degree: 'MD - General Medicine', institution: 'Madras Medical College' }, { degree: 'DM - Neurology', institution: 'NIMHANS' }],
      schedules: [
        { dayOfWeek: 'MONDAY', startTime: '14:00', endTime: '19:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '14:00', endTime: '19:00' },
        { dayOfWeek: 'FRIDAY', startTime: '14:00', endTime: '19:00' },
      ],
    },
  ];

  const createdDoctors = [];
  for (const doc of doctorFixtures) {
    let user = await prisma.user.findUnique({ where: { email: doc.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          hospitalId: hospital.id,
          branchId: branch.id,
          email: doc.email,
          passwordHash,
          firstName: doc.firstName,
          lastName: doc.lastName,
          phone: doc.phone,
          isActive: true,
        },
      });
    }

    if (doctorRole) {
      const existingRole = await prisma.userRole.findFirst({ where: { userId: user.id, roleId: doctorRole.id } });
      if (!existingRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: doctorRole.id,
            hospitalId: hospital.id,
            branchId: branch.id,
            scopeKey: `BRANCH:${branch.id}`,
          },
        });
      }
    }

    let employee = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      const code = 'EMP-' + doc.firstName.toUpperCase().slice(0, 3) + Math.floor(100 + Math.random() * 900);
      employee = await prisma.employee.create({
        data: {
          hospitalId: hospital.id,
          branchId: branch.id,
          userId: user.id,
          employeeCode: code,
          designation: doc.designation,
          dateOfJoining: new Date('2018-01-01'),
          departmentId: depts[doc.deptCode].id,
        },
      });
    }

    let doctor = await prisma.doctor.findUnique({ where: { employeeId: employee.id } });
    const doctorData = {
      hospitalId: hospital.id,
      branchId: branch.id,
      departmentId: depts[doc.deptCode].id,
      designation: doc.designation,
      specialization: doc.specialization,
      experienceYears: doc.experienceYears,
      gender: doc.gender,
      bio: doc.bio,
      consultationFee: doc.consultationFee,
      isAvailableToday: true,
      availableDays: doc.schedules.map((s) => s.dayOfWeek.slice(0, 3)),
    };

    if (!doctor) {
      const license = 'TN-DOC-' + Math.floor(10000 + Math.random() * 90000);
      doctor = await prisma.doctor.create({
        data: {
          ...doctorData,
          employeeId: employee.id,
          licenseNumber: license,
        },
      });
    } else {
      doctor = await prisma.doctor.update({
        where: { id: doctor.id },
        data: doctorData,
      });
    }

    // Qualifications
    for (const q of doc.qualifications) {
      const existingQ = await prisma.doctorQualification.findFirst({
        where: { doctorId: doctor.id, degree: q.degree },
      });
      if (!existingQ) {
        await prisma.doctorQualification.create({
          data: { doctorId: doctor.id, degree: q.degree, institution: q.institution, yearPassed: 2012 },
        });
      }
    }

    // Schedules
    for (const s of doc.schedules) {
      const existingS = await prisma.doctorSchedule.findFirst({
        where: { doctorId: doctor.id, dayOfWeek: s.dayOfWeek },
      });
      if (!existingS) {
        await prisma.doctorSchedule.create({
          data: { doctorId: doctor.id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, maxPatients: 20 },
        });
      }
    }

    createdDoctors.push(doctor);
  }

  // 3. Ensure Demo Patient (patient@demo.uyirinai.test) has rich data
  let patientUser = await prisma.user.findUnique({ where: { email: 'patient@demo.uyirinai.test' } });
  if (!patientUser) {
    patientUser = await prisma.user.create({
      data: {
        hospitalId: hospital.id,
        branchId: branch.id,
        email: 'patient@demo.uyirinai.test',
        passwordHash,
        firstName: 'Lakshmi',
        lastName: 'Sundaram',
        phone: '+919876543210',
        isActive: true,
      },
    });
  }

  if (patientRole) {
    const existingPatientRole = await prisma.userRole.findFirst({ where: { userId: patientUser.id, roleId: patientRole.id } });
    if (!existingPatientRole) {
      await prisma.userRole.create({
        data: {
          userId: patientUser.id,
          roleId: patientRole.id,
          hospitalId: hospital.id,
          branchId: branch.id,
          scopeKey: `BRANCH:${branch.id}`,
        },
      });
    }
  }

  let patient = await prisma.patient.findFirst({ where: { userId: patientUser.id } });
  const patientProfileData = {
    firstName: 'Lakshmi',
    lastName: 'Sundaram',
    dateOfBirth: new Date('1990-08-14T00:00:00Z'),
    gender: 'FEMALE',
    bloodGroup: 'O_POSITIVE',
    phone: '+919876543210',
    email: 'patient@demo.uyirinai.test',
    addressLine1: '42 Bharathiyar Street, Anna Nagar',
    city: 'Madurai',
    state: 'Tamil Nadu',
    postalCode: '625020',
    emergencyContactName: 'Sundaram Rajan',
    emergencyContactPhone: '+919876543219',
    emergencyContactRelation: 'Spouse',
    allergies: ['Penicillin', 'Dust Mites'],
    medicalHistoryNotes: 'Mild seasonal bronchial sensitivity, annual wellness checkups routine.',
  };

  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        hospitalId: hospital.id,
        registrationBranchId: branch.id,
        userId: patientUser.id,
        uhid: 'DEMO-UHID-001',
        ...patientProfileData,
      },
    });
  } else {
    patient = await prisma.patient.update({
      where: { id: patient.id },
      data: patientProfileData,
    });
  }

  // 4. Seed Appointments for Demo Patient
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next3Days = new Date();
  next3Days.setDate(next3Days.getDate() + 3);

  const existingUpcoming = await prisma.appointment.findFirst({
    where: { patientId: patient.id, status: 'SCHEDULED' },
  });

  if (!existingUpcoming) {
    await prisma.appointment.create({
      data: {
        hospitalId: hospital.id,
        branchId: branch.id,
        patientId: patient.id,
        doctorId: createdDoctors[0].id,
        departmentId: depts['GENMED'].id,
        appointmentNumber: 'APT-2026-' + Math.floor(1000 + Math.random() * 9000),
        appointmentDate: tomorrow,
        appointmentTime: '10:30',
        tokenNumber: 4,
        status: 'SCHEDULED',
        type: 'OPD',
        reasonForVisit: 'Routine wellness examination and blood pressure review',
        consultationFee: 500,
        isPaid: false,
      },
    });

    await prisma.appointment.create({
      data: {
        hospitalId: hospital.id,
        branchId: branch.id,
        patientId: patient.id,
        doctorId: createdDoctors[1].id,
        departmentId: depts['CARD'].id,
        appointmentNumber: 'APT-2026-' + Math.floor(1000 + Math.random() * 9000),
        appointmentDate: next3Days,
        appointmentTime: '11:00',
        tokenNumber: 2,
        status: 'SCHEDULED',
        type: 'OPD',
        reasonForVisit: 'Preventive cardiology assessment',
        consultationFee: 800,
        isPaid: false,
      },
    });
  }

  // Completed Appointments for Medical History tab
  const pastDate1 = new Date();
  pastDate1.setDate(pastDate1.getDate() - 14);
  const pastDate2 = new Date();
  pastDate2.setDate(pastDate2.getDate() - 42);

  const existingCompleted = await prisma.appointment.findFirst({
    where: { patientId: patient.id, status: 'COMPLETED' },
  });

  if (!existingCompleted) {
    // Completed Apt 1
    const apt1 = await prisma.appointment.create({
      data: {
        hospitalId: hospital.id,
        branchId: branch.id,
        patientId: patient.id,
        doctorId: createdDoctors[0].id,
        departmentId: depts['GENMED'].id,
        appointmentNumber: 'APT-2026-0812',
        appointmentDate: pastDate1,
        appointmentTime: '10:00',
        tokenNumber: 1,
        status: 'COMPLETED',
        type: 'OPD',
        reasonForVisit: 'Mild fever and dry cough',
        consultationFee: 500,
        isPaid: true,
        completedAt: pastDate1,
      },
    });

    // Consultation
    const consult1 = await prisma.consultation.create({
      data: {
        appointmentId: apt1.id,
        hospitalId: hospital.id,
        branchId: branch.id,
        patientId: patient.id,
        doctorId: createdDoctors[0].id,
        status: 'COMPLETED',
        chiefComplaint: 'Fever for 2 days with sore throat',
        diagnosisNotes: 'Acute Upper Respiratory Tract Infection (URTI). Vitals stable.',
        treatmentPlan: 'Hydration, paracetamol as needed, rest for 3 days.',
        followUpDate: tomorrow,
      },
    });

    // Prescription
    await prisma.prescription.create({
      data: {
        consultationId: consult1.id,
        appointmentId: apt1.id,
        patientId: patient.id,
        doctorId: createdDoctors[0].id,
        hospitalId: hospital.id,
        branchId: branch.id,
        prescriptionNumber: 'PRX-2026-0812',
        dispensingStatus: 'DISPENSED',
      },
    });

    // Pharmacy bill / Invoice
    await prisma.invoice.create({
      data: {
        hospitalId: hospital.id,
        branchId: branch.id,
        patientId: patient.id,
        appointmentId: apt1.id,
        invoiceNumber: 'INV-2026-0812',
        totalAmount: 650.00,
        paidAmount: 650.00,
        status: 'PAID',
        items: {
          create: [
            { description: 'OPD Consultation Fee - General Medicine', quantity: 1, unitPrice: 500.00, totalPrice: 500.00 },
            { description: 'Prescription Dispensing - Paracetamol 650mg & Cetirizine 10mg', quantity: 1, unitPrice: 150.00, totalPrice: 150.00 },
          ],
        },
        payments: {
          create: [
            { amount: 650.00, paymentMethod: 'UPI', paymentStatus: 'SUCCESS', transactionRef: 'UPI-TXN-982341' },
          ],
        },
      },
    });

    // Completed Apt 2
    const apt2 = await prisma.appointment.create({
      data: {
        hospitalId: hospital.id,
        branchId: branch.id,
        patientId: patient.id,
        doctorId: createdDoctors[2].id,
        departmentId: depts['PED'].id,
        appointmentNumber: 'APT-2026-0421',
        appointmentDate: pastDate2,
        appointmentTime: '09:30',
        tokenNumber: 3,
        status: 'COMPLETED',
        type: 'OPD',
        reasonForVisit: 'General health review and immunization advice',
        consultationFee: 600,
        isPaid: true,
        completedAt: pastDate2,
      },
    });

    const consult2 = await prisma.consultation.create({
      data: {
        appointmentId: apt2.id,
        hospitalId: hospital.id,
        branchId: branch.id,
        patientId: patient.id,
        doctorId: createdDoctors[2].id,
        status: 'COMPLETED',
        chiefComplaint: 'General preventive checkup',
        diagnosisNotes: 'Normal physiological status. Nutrition and immunity satisfactory.',
        treatmentPlan: 'Maintain balanced diet, multivitamin supplement prescribed.',
      },
    });

    await prisma.prescription.create({
      data: {
        consultationId: consult2.id,
        appointmentId: apt2.id,
        patientId: patient.id,
        doctorId: createdDoctors[2].id,
        hospitalId: hospital.id,
        branchId: branch.id,
        prescriptionNumber: 'PRX-2026-0421',
        dispensingStatus: 'DISPENSED',
      },
    });

    await prisma.invoice.create({
      data: {
        hospitalId: hospital.id,
        branchId: branch.id,
        patientId: patient.id,
        appointmentId: apt2.id,
        invoiceNumber: 'INV-2026-0421',
        totalAmount: 750.00,
        paidAmount: 750.00,
        status: 'PAID',
        items: {
          create: [
            { description: 'OPD Specialist Consultation - Pediatrics', quantity: 1, unitPrice: 600.00, totalPrice: 600.00 },
            { description: 'Multivitamin Syrup & Zinc Tabs', quantity: 1, unitPrice: 150.00, totalPrice: 150.00 },
          ],
        },
        payments: {
          create: [
            { amount: 750.00, paymentMethod: 'CREDIT_CARD', paymentStatus: 'SUCCESS', transactionRef: 'CC-TXN-441290' },
          ],
        },
      },
    });
  }

  // 5. Seed Lab Orders & Reports for patient
  let testParam = await prisma.testParameter.findFirst();
  if (!testParam) {
    let labCategory = await prisma.labCategory.findFirst({ where: { hospitalId: hospital.id } });
    if (!labCategory) {
      labCategory = await prisma.labCategory.create({
        data: { hospitalId: hospital.id, name: 'Hematology', code: 'HEM' },
      });
    }
    let labTest = await prisma.labTest.findFirst({ where: { hospitalId: hospital.id } });
    if (!labTest) {
      labTest = await prisma.labTest.create({
        data: {
          hospitalId: hospital.id,
          categoryId: labCategory.id,
          testCode: 'CBC-01',
          name: 'Complete Blood Count (CBC)',
          cost: 350,
          sampleType: 'Whole Blood',
        },
      });
    }
    testParam = await prisma.testParameter.create({
      data: {
        labTestId: labTest.id,
        parameterName: 'Hemoglobin',
        unit: 'g/dL',
        normalRangeStr: '12.0 - 15.5',
      },
    });
  }

  const existingLab = await prisma.labOrder.findFirst({ where: { patientId: patient.id } });
  if (!existingLab && testParam) {
    const labOrder = await prisma.labOrder.create({
      data: {
        hospitalId: hospital.id,
        branchId: branch.id,
        patientId: patient.id,
        doctorId: createdDoctors[0].id,
        orderNumber: 'LAB-2026-0815',
        status: 'COMPLETED',
        reportReleasedAt: new Date(),
        clinicalNotes: 'Screening for anemia and infection markers',
      },
    });

    await prisma.labResult.create({
      data: {
        labOrderId: labOrder.id,
        parameterId: testParam.id,
        measuredValue: '13.4',
        unit: 'g/dL',
        referenceRange: '12.0 - 15.5',
      },
    });
  }

  // 6. Seed Notifications for patient
  await prisma.notification.deleteMany({ where: { userId: patientUser.id } });

  const notificationsToCreate = [
    {
      type: 'APPOINTMENT_REMINDER',
      title: 'Upcoming Appointment in 2 Days',
      message: 'Reminder: You have an appointment with Dr. Priya Soundararajan (Cardiology) scheduled in 2 days at 11:00 AM.',
      isRead: false,
    },
    {
      type: 'APPOINTMENT_REMINDER',
      title: 'Appointment Reminder - Tomorrow',
      message: 'Reminder: Tomorrow you have an appointment with Dr. Arun Kumar (General Medicine) at 10:30 AM (IST).',
      isRead: false,
    },
    {
      type: 'APPOINTMENT_REMINDER',
      title: 'Appointment Today',
      message: 'Your appointment with Dr. Arun Kumar is today at 10:30 AM. Please arrive 15 minutes before your token time.',
      isRead: false,
    },
    {
      type: 'APPOINTMENT',
      title: 'Appointment Scheduled & Confirmed',
      message: 'Department Admin has confirmed your appointment booking with Dr. Arun Kumar for 10:30 AM. Token #4.',
      isRead: false,
    },
    {
      type: 'LAB_RESULT',
      title: 'Lab Report Available',
      message: 'Your diagnostic laboratory report (Complete Blood Count) has been verified and released by Dr. Arun Kumar.',
      isRead: true,
    },
    {
      type: 'PRESCRIPTION',
      title: 'Prescription Ready',
      message: 'Prescription PRX-2026-0812 has been dispensed by the hospital pharmacy.',
      isRead: true,
    },
  ];

  await prisma.notification.createMany({
    data: notificationsToCreate.map((n) => ({
      userId: patientUser.id,
      hospitalId: hospital.id,
      branchId: branch.id,
      ...n,
    })),
  });

  console.log('Seeding complete! 5 doctors, patient profile, appointments, lab reports, invoices, and notifications seeded.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
