import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role } from '../packages/contracts/dist/index.js';
import { seedReferenceData } from './seed.mjs';
import { teamDatabase, teamDatabaseUrl } from './team-database.mjs';

const password = 'UyirinaiTeamDemo!24';
const domain = 'demo.uyirinai.test';
const firstMarker = 'uyirinai-team-demo-seed-v1';
const scenarios = [1, 2, 3, 4, 5];
const scenarioKey = (base, index) => index === 1 ? base : `${base}-${String(index).padStart(2, '0')}`;
const markerFor = index => scenarioKey(firstMarker, index);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const emailFor = (role, index) => `${scenarioKey(role.toLowerCase(), index)}@${domain}`;
const hospitalWide = new Set([Role.SUPER_ADMIN, Role.PATIENT]);
const departmentScoped = new Set([Role.DEPARTMENT_ADMIN, Role.DOCTOR, Role.NURSE, Role.HEAD_NURSE]);

async function createDemoHospital(tx) {
  const hospital = await tx.hospital.create({ data: {
    code: 'UYIRINAI', name: 'Uyirinai Demo Hospital', verificationStatus: 'VERIFIED',
    addressLine1: '1 Demo Road', city: 'Madurai', state: 'Tamil Nadu', postalCode: '625001',
    phone: '+910000000001', email: `hospital@${domain}`, licenseNumber: 'DEMO-HOSPITAL-001',
    inventoryLedgerCutoverAt: new Date(),
  } });
  await tx.branch.create({ data: {
    hospitalId: hospital.id, code: 'NORTH', name: 'Demo North Branch', address: '2 Demo Road', city: 'Madurai',
    phone: '+910000000003',
  } });
  return hospital;
}

async function populate(tx, hospital, passwordHash, roles, index) {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const today = new Date(`${date}T00:00:00Z`);
  const key = base => scenarioKey(base, index);
  const phone = digit => `+9100000000${index - 1}${digit}`;
  const name = base => index === 1 ? base : `${base} ${index}`;
  const hospitalId = hospital.id;
  const branch = await tx.branch.create({ data: {
    hospitalId, code: index === 1 ? 'MAIN' : key('DEMO'),
    name: index === 1 ? 'Demo Main Branch' : name('Demo Branch'),
    address: '1 Demo Road', city: 'Madurai', phone: phone(2),
  } });
  const scope = { hospitalId, branchId: branch.id };
  const department = await tx.department.create({ data: { ...scope, code: key('GEN_MED'), name: 'General Medicine' } });
  const departmentId = department.id;

  const accounts = new Map();
  const employees = new Map();
  for (const role of Object.values(Role)) {
    const roleId = roles.find(row => row.name === role).id;
    const branchId = hospitalWide.has(role) ? null : branch.id;
    const departmentScope = departmentScoped.has(role) ? departmentId : null;
    const user = await tx.user.create({ data: {
      hospitalId, branchId, email: emailFor(role, index), passwordHash, firstName: name('Demo'), lastName: role.replaceAll('_', ' '),
    } });
    await tx.userRole.create({ data: {
      hospitalId, userId: user.id, roleId, branchId, departmentId: departmentScope,
      scopeKey: departmentScope ? `dept:${branchId}:${departmentScope}` : branchId ? `branch:${branchId}` : 'GLOBAL',
    } });
    accounts.set(role, user.id);
    if (branchId) {
      const employee = await tx.employee.create({ data: {
        ...scope, userId: user.id, departmentId: departmentScope, employeeCode: key(`DEMO-${role}`),
        designation: user.lastName, dateOfJoining: today,
      } });
      employees.set(role, employee.id);
    }
  }

  const doctor = await tx.doctor.create({ data: {
    ...scope, departmentId, employeeId: employees.get(Role.DOCTOR), designation: 'GENERAL_PHYSICIAN',
    licenseNumber: key('DEMO-DOCTOR-001'), specialization: 'General Medicine',
    availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  } });
  const doctorId = doctor.id;
  await tx.doctorQualification.create({ data: { doctorId, degree: 'MBBS', institution: 'Demo Medical College', yearPassed: 2015 } });
  await tx.doctorSchedule.createMany({ data: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(dayOfWeek => ({
    doctorId, dayOfWeek, startTime: '09:00', endTime: '17:00',
  })) });
  await tx.doctorLeave.create({ data: {
    doctorId, startDate: new Date('2030-01-02'), endDate: new Date('2030-01-02'), reason: 'Demo leave request',
  } });
  const nurse = await tx.nursingStaff.create({ data: { ...scope, employeeId: employees.get(Role.NURSE) } });
  await tx.nursingStaff.create({ data: { ...scope, employeeId: employees.get(Role.HEAD_NURSE), isHeadNurse: true } });

  const patientData = {
    hospitalId, registrationBranchId: branch.id, firstName: name('Demo'), gender: 'FEMALE',
    dateOfBirth: new Date('1992-05-15'), addressLine1: '3 Demo Road', city: 'Madurai', state: 'Tamil Nadu',
    postalCode: '625001', emergencyContactName: 'Demo Contact', emergencyContactPhone: phone(5),
    emergencyContactRelation: 'Sibling',
  };
  const patient = await tx.patient.create({ data: {
    ...patientData, lastName: 'Patient', uhid: key('DEMO-UHID-001'), phone: phone(4),
    userId: accounts.get(Role.PATIENT), email: emailFor(Role.PATIENT, index),
  } });
  const patientId = patient.id;
  const waiting = await tx.patient.create({ data: {
    ...patientData, lastName: 'Waiting', uhid: key('DEMO-UHID-002'), phone: phone(6),
  } });
  await tx.patientDocument.create({ data: {
    ...scope, patientId, title: 'Demo patient document', documentType: 'OTHER',
    fileUrl: 'https://example.invalid/demo/patient-document.pdf', uploadedBy: accounts.get(Role.RECEPTIONIST),
  } });

  const encounter = { ...scope, patientId, doctorId };
  const visit = { ...encounter, departmentId, appointmentDate: today, consultationFee: 500, reasonForVisit: 'Demo checkup' };
  const appointment = await tx.appointment.create({ data: {
    ...visit, appointmentNumber: key('DEMO-APT-001'), appointmentTime: '09:00', tokenNumber: 1, status: 'COMPLETED', isPaid: true,
  } });
  await tx.appointment.create({ data: {
    ...visit, patientId: waiting.id, appointmentNumber: key('DEMO-APT-002'), appointmentTime: '10:00', tokenNumber: 2,
  } });
  const patientName = name('Demo Booking');
  const requestPhone = `+1202555010${index}`;
  const specialty = 'General Medicine';
  await tx.appointmentRequest.create({ data: {
    hospitalId, patientName, phone: requestPhone, specialty, preferredDate: today,
    submissionKey: digest([patientName.toLowerCase(), requestPhone, specialty, date]),
  } });
  const consultation = await tx.consultation.create({ data: {
    ...encounter, appointmentId: appointment.id, chiefComplaint: 'Demo symptom',
    diagnosisNotes: 'Synthetic consultation notes', treatmentPlan: 'Demo follow-up',
  } });

  const ward = await tx.ward.create({ data: { ...scope, departmentId, name: 'Demo Medical Ward', code: key('MED'), totalBeds: 2, occupiedBeds: 1 } });
  const bed = await tx.bed.create({ data: {
    ...scope, wardId: ward.id, roomNumber: '101', bedNumber: '01', status: 'OCCUPIED',
    currentPatientId: patientId, currentPatientName: `${patient.firstName} ${patient.lastName}`,
  } });
  await tx.bed.create({ data: { ...scope, wardId: ward.id, roomNumber: '101', bedNumber: '02' } });
  const admission = await tx.admission.create({ data: {
    ...scope, patientId, wardId: ward.id, bedId: bed.id, admittingDoctorId: doctorId,
    admissionNumber: key('DEMO-ADM-001'), admissionReason: 'Demo observation', initialDiagnosis: 'Synthetic diagnosis',
  } });
  const inpatient = { ...scope, patientId, admissionId: admission.id };
  await tx.nursingAssignment.create({ data: { ...scope, nurseId: nurse.id, wardId: ward.id, assignedDate: today, shift: 'DAY' } });
  await tx.vitalsRecord.create({ data: {
    ...inpatient, recordedByUserId: accounts.get(Role.NURSE), systolicBp: 120, diastolicBp: 80, pulseRate: 72,
  } });
  await tx.nursingTask.create({ data: {
    ...inpatient, assignedNurseId: nurse.id, taskTitle: 'Repeat vitals', taskDescription: 'Demo nursing task',
    dueTime: new Date(Date.now() + 3_600_000),
  } });

  const medicine = await tx.medicine.create({ data: {
    code: key('DEMO-MED-001'), brandName: 'Demo Tablet', genericName: 'Demo Medication', category: 'ANALGESIC',
    strength: '500 mg', dosageForm: 'TABLET', manufacturer: 'Demo Manufacturer', unitPrice: 10, currentStock: 98,
  } });
  const medicineId = medicine.id;
  const prescription = await tx.prescription.create({ data: {
    ...encounter, consultationId: consultation.id, prescriptionNumber: key('DEMO-RX-001'), dispensingStatus: 'DISPENSED',
  } });
  const item = await tx.prescriptionItem.create({ data: {
    ...scope, prescriptionId: prescription.id, medicineId, dosage: '1 tablet', frequency: '1-0-1',
    durationDays: 1, instructions: 'Synthetic medication instructions', dispensedQuantity: 2,
  } });
  const batch = await tx.medicineBatch.create({ data: {
    ...scope, medicineId, batchNumber: key('DEMO-BATCH-001'), expiryDate: new Date(today.getTime() + 365 * 86_400_000),
    quantity: 100, purchasePrice: 5, sellingPrice: 10,
  } });
  const pharmacist = accounts.get(Role.PHARMACIST);
  const movement = { ...scope, medicineId, batchId: batch.id, performedByUserId: pharmacist };
  await tx.inventoryMovement.create({ data: {
    ...movement, movementType: 'OPENING_BALANCE', quantityDelta: 100, createdAt: hospital.inventoryLedgerCutoverAt,
    idempotencyKey: key('demo-stock-opening'), requestFingerprint: digest([key('demo-stock-opening'), 100]),
  } });
  const dispensing = await tx.dispensingRecord.create({ data: {
    ...scope, prescriptionId: prescription.id, batchId: batch.id, dispensedQuantity: 2, pharmacistUserId: pharmacist,
  } });
  await tx.inventoryMovement.create({ data: {
    ...movement, movementType: 'DISPENSE', quantityDelta: -2, dispensingRecordId: dispensing.id,
    idempotencyKey: key('demo-stock-dispense'), requestFingerprint: digest([key('demo-stock-dispense'), 2]),
  } });
  await tx.medicineBatch.update({ where: { id: batch.id }, data: { quantity: 98 } });
  await tx.medicationAdministration.create({ data: {
    ...scope, prescriptionItemId: item.id, admissionId: admission.id, nurseId: nurse.id, administeredDose: '1 tablet',
  } });

  const labTest = await tx.labTest.create({ data: {
    testCode: key('DEMO-LAB-TEST'), name: 'Demo Blood Count', category: 'HEMATOLOGY', sampleType: 'BLOOD', price: 250,
  } });
  const parameter = await tx.testParameter.create({ data: { labTestId: labTest.id, parameterName: 'Hemoglobin', unit: 'g/dL' } });
  const order = await tx.labOrder.create({ data: { ...encounter, orderNumber: key('DEMO-LAB-001'), barcode: key('DEMO-BARCODE-001'), status: 'COMPLETED' } });
  await tx.labOrderItem.create({ data: { labOrderId: order.id, labTestId: labTest.id } });
  await tx.labResult.create({ data: { labOrderId: order.id, parameterId: parameter.id, measuredValue: '13.5', unit: 'g/dL', referenceRange: '12–16' } });
  const radiologyTest = await tx.radiologyTest.create({ data: { testCode: key('DEMO-XRAY'), name: 'Demo Chest X-Ray', modality: 'XRAY', price: 400 } });
  await tx.radiologyOrder.create({ data: {
    ...encounter, orderNumber: key('DEMO-RAD-001'), testId: radiologyTest.id, clinicalIndication: 'Demo imaging request',
  } });

  const invoice = await tx.invoice.create({ data: {
    ...scope, patientId, appointmentId: appointment.id, invoiceNumber: key('DEMO-INV-001'),
    subTotal: 500, totalAmount: 500, paidAmount: 500, status: 'PAID',
  } });
  await tx.invoiceItem.create({ data: { invoiceId: invoice.id, description: 'Demo consultation', category: 'CONSULTATION', unitPrice: 500, totalPrice: 500 } });
  await tx.payment.create({ data: {
    ...scope, invoiceId: invoice.id, amount: 500, paymentMethod: 'CASH', receivedByUserId: accounts.get(Role.BILLING_STAFF),
    idempotencyKey: key('demo-payment-001'), requestFingerprint: digest([key('demo-payment-001'), 500]),
  } });
  const inpatientInvoice = await tx.invoice.create({ data: {
    ...inpatient, invoiceNumber: key('DEMO-INV-002'), subTotal: 1000, totalAmount: 1000,
  } });
  await tx.invoiceItem.create({ data: {
    invoiceId: inpatientInvoice.id, description: 'Demo room charge', category: 'ROOM', unitPrice: 1000, totalPrice: 1000,
  } });
  await tx.insuranceClaim.create({ data: {
    ...scope, invoiceId: inpatientInvoice.id, patientId, claimNumber: key('DEMO-CLAIM-001'),
    providerName: 'Demo Insurer', policyNumber: key('DEMO-POLICY-001'), claimAmount: 1000,
  } });

  const ambulance = await tx.ambulance.create({ data: { ...scope, vehicleNumber: key('DEMO-AMB-01'), model: 'Demo Ambulance', isAvailable: false } });
  const driver = await tx.ambulanceDriver.create({ data: {
    ...scope, employeeId: employees.get(Role.AMBULANCE_DRIVER), licenseNumber: key('DEMO-DL-001'), phone: phone(8),
  } });
  await tx.ambulanceTrip.create({ data: {
    ...scope, ambulanceId: ambulance.id, driverId: driver.id, tripCode: key('DEMO-TRIP-001'), callerName: 'Demo Caller',
    callerPhone: phone(9), pickupLocation: 'Demo pickup', destinationHospital: hospital.name,
    patientConditionSummary: 'Synthetic dispatch record',
  } });

  const adminId = accounts.get(Role.SUPER_ADMIN);
  await tx.notification.create({ data: {
    hospitalId, userId: accounts.get(Role.PATIENT), type: 'APPOINTMENT', title: 'Demo appointment', message: 'Your demo appointment is ready.',
  } });
  // A terminal job illustrates export history without scheduling work on setup.
  await tx.reportExportJob.create({ data: {
    hospitalId, requestedById: adminId, reportKey: 'appointments', format: 'CSV', status: 'FAILED',
  } });
  await tx.auditLog.create({ data: {
    id: markerFor(index), hospitalId, userId: adminId, userEmail: emailFor(Role.SUPER_ADMIN, index),
    userRole: Role.SUPER_ADMIN, action: 'CREATE', resource: 'DEMO_FIXTURES',
  } });
}

async function main() {
  const prisma = new PrismaClient({ datasourceUrl: teamDatabaseUrl() });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const inserted = await prisma.$transaction(async tx => {
      const [target] = await tx.$queryRaw`SELECT current_database() AS name, current_schema() AS schema`;
      if (!['uyirinai_hms_team', 'uyirinai_hms_new'].includes(target?.name) || target?.schema !== 'public') throw new Error('Unexpected database or schema.');
      // Serialize repeated setup and commit the marker with all fixtures.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(577901320)`;
      const markers = await tx.auditLog.findMany({ where: { id: { in: scenarios.map(markerFor) } } });
      const installed = new Set(markers.map(row => row.id));
      const pending = scenarios.filter(index => !installed.has(markerFor(index)));
      if (pending.length === 0) return 0;

      const baseline = markers.find(row => row.id === firstMarker);
      let hospital;
      if (baseline) {
        hospital = await tx.hospital.findUnique({ where: { id: baseline.hospitalId, code: 'UYIRINAI' } });
        if (!hospital || hospital.deletedAt || !hospital.isActive || !hospital.inventoryLedgerCutoverAt) {
          throw new Error('The original demo hospital is missing or inactive.');
        }
      } else {
        if (await tx.hospital.count()) throw new Error('The team database already contains a hospital. Use an empty team database.');
        await seedReferenceData(tx);
        hospital = await createDemoHospital(tx);
      }

      const roles = await tx.role.findMany();
      for (const index of pending) await populate(tx, hospital, passwordHash, roles, index);
      return pending.length;
    }, { timeout: 60_000 });
    console.log(inserted ? `Installed ${inserted} demo scenario(s).` : 'All demo scenarios are already installed.');
    console.log(`Initial demo password: ${password}`);
    for (const role of Object.values(Role)) console.log(scenarios.map(index => emailFor(role, index)).join(', '));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error('Team seed failed:', error.message);
  process.exitCode = 1;
});
