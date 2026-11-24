import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { BloodGroup, Gender, Role, ROLE_PERMISSIONS_MATRIX } from '../packages/contracts/dist/index.js';

function readDatabaseUrl() {
  const envFile = fileURLToPath(new URL('../.env', import.meta.url));
  if (!process.env.DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile);
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('Missing DATABASE_URL in .env');
  return value;
}

const systemData = [
  { key: 'BLOOD_GROUP', name: 'Blood Group', codes: Object.values(BloodGroup) },
  { key: 'GENDER', name: 'Gender', codes: Object.values(Gender) },
];

async function seed() {
  const datasourceUrl = readDatabaseUrl();
  const prisma = new PrismaClient({ datasourceUrl });

  try {
    console.log('Seeding Aalayam/Uyirinai HMS database with complete clinical & operational data...');
    const passwordHash = await bcrypt.hash('Password@123', 12);

    await prisma.$transaction(async tx => {
      // 1. Roles & Permissions
      const roleNames = Object.keys(ROLE_PERMISSIONS_MATRIX);
      await tx.role.createMany({
        data: roleNames.map(name => ({ name })),
        skipDuplicates: true,
      });
      const roles = await tx.role.findMany({ select: { id: true, name: true } });
      const roleMap = new Map(roles.map(r => [r.name, r.id]));

      const permissionKeys = [...new Set(Object.values(ROLE_PERMISSIONS_MATRIX).flat())];
      const permissions = permissionKeys.map(key => {
        const [resource, action] = key.split(':');
        return { resource, action };
      });
      await tx.permission.createMany({
        data: permissions,
        skipDuplicates: true,
      });
      const permissionRows = await tx.permission.findMany({ select: { id: true, resource: true, action: true } });
      const permMap = new Map(permissionRows.map(p => [`${p.resource}:${p.action}`, p.id]));

      const rolePerms = [];
      for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS_MATRIX)) {
        const roleId = roleMap.get(roleName);
        if (!roleId) continue;
        for (const k of keys) {
          const permissionId = permMap.get(k);
          if (permissionId) {
            rolePerms.push({ roleId, permissionId });
          }
        }
      }
      await tx.rolePermission.createMany({
        data: rolePerms,
        skipDuplicates: true,
      });

      // 2. Hospitals (Aalayam & Uyirinai)
      const hospital = await tx.hospital.upsert({
        where: { code: 'AALAYAM' },
        update: {
          name: 'Aalayam Multispeciality Hospital',
          verificationStatus: 'VERIFIED',
          isActive: true,
        },
        create: {
          name: 'Aalayam Multispeciality Hospital',
          code: 'AALAYAM',
          tamilName: 'ஆலயம் பல்நோக்கு மருத்துவமனை',
          addressLine1: '123 Healthcare Ave',
          city: 'Madurai',
          state: 'Tamil Nadu',
          postalCode: '625001',
          country: 'India',
          phone: '+91 9876543210',
          email: 'admin@aalayamhospital.com',
          licenseNumber: 'HOSP-TN-2026-001',
          verificationStatus: 'VERIFIED',
          isActive: true,
        },
      });

      const uyirinai = await tx.hospital.upsert({
        where: { code: 'UYIRINAI' },
        update: {
          name: 'Uyirinai Multispeciality Hospital',
          verificationStatus: 'VERIFIED',
          isActive: true,
        },
        create: {
          name: 'Uyirinai Multispeciality Hospital',
          code: 'UYIRINAI',
          tamilName: 'உயிரினை பல்நோக்கு மருத்துவமனை',
          addressLine1: '123 Healthcare Ave',
          city: 'Madurai',
          state: 'Tamil Nadu',
          postalCode: '625001',
          country: 'India',
          phone: '+91 9876543210',
          email: 'admin@uyirinai.com',
          licenseNumber: 'HOSP-TN-2026-002',
          verificationStatus: 'VERIFIED',
          isActive: true,
        },
      });

      // 3. Branch
      const branch = await tx.branch.upsert({
        where: { hospitalId_code: { hospitalId: hospital.id, code: 'MAIN' } },
        update: { isActive: true, address: '123 Healthcare Ave' },
        create: {
          hospitalId: hospital.id,
          name: 'Madurai Main Branch',
          code: 'MAIN',
          address: '123 Healthcare Ave',
          city: 'Madurai',
          state: 'Tamil Nadu',
          phone: '+91 9876543210',
          email: 'main@aalayamhospital.com',
          isActive: true,
        },
      });

      const demoBranches = [
        { code: 'DEMO-NORTH', name: 'Madurai North Branch', address: 'North Madurai', isActive: true },
        { code: 'DEMO-SOUTH', name: 'Madurai South Branch', address: 'South Madurai', isActive: true },
        { code: 'DEMO-WEST', name: 'Madurai West Branch', address: 'West Madurai', isActive: false },
      ];
      await tx.branch.createMany({
        data: [hospital.id, uyirinai.id].flatMap(hospitalId =>
          demoBranches.map(branch => ({
            ...branch,
            hospitalId,
            city: 'Madurai',
            state: 'Tamil Nadu',
            country: 'India',
            phone: '0000000000',
          }))
        ),
        skipDuplicates: true,
      });

      // 4. Departments
      const deptGenMed = await tx.department.upsert({
        where: { hospitalId_code: { hospitalId: hospital.id, code: 'GEN_MED' } },
        update: { isActive: true, branchId: branch.id },
        create: {
          hospitalId: hospital.id,
          branchId: branch.id,
          name: 'General Medicine',
          code: 'GEN_MED',
          description: 'Internal & General Medicine Department',
          isActive: true,
        },
      });

      const deptCardio = await tx.department.upsert({
        where: { hospitalId_code: { hospitalId: hospital.id, code: 'CARDIO' } },
        update: { isActive: true, branchId: branch.id },
        create: {
          hospitalId: hospital.id,
          branchId: branch.id,
          name: 'Cardiology',
          code: 'CARDIO',
          description: 'Cardiology & Intensive Coronary Care',
          isActive: true,
        },
      });

      // Helper function to create user + userRole
      async function setupStaffUser({ email, firstName, lastName, role, branchId = null, departmentId = null, scopeKey = 'GLOBAL' }) {
        const roleId = roleMap.get(role);
        if (!roleId) throw new Error(`Role ${role} not found in roleMap`);

        let user = await tx.user.findUnique({ where: { email } });
        if (!user) {
          user = await tx.user.create({
            data: { email, passwordHash, firstName, lastName, hospitalId: hospital.id, branchId, isActive: true },
          });
        } else {
          await tx.user.update({
            where: { id: user.id },
            data: { passwordHash, isActive: true, hospitalId: hospital.id, branchId },
          });
        }

        await tx.userRole.deleteMany({ where: { userId: user.id } });
        await tx.userRole.create({
          data: { userId: user.id, hospitalId: hospital.id, roleId, branchId, departmentId, scopeKey },
        });

        return user;
      }

      // --- Staff Accounts ---

      // 1. Super Admin
      await setupStaffUser({
        email: 'superadmin@aalayamhospital.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: Role.SUPER_ADMIN,
        branchId: null,
        departmentId: null,
        scopeKey: 'GLOBAL',
      });

      // 2. Hospital Admin
      await setupStaffUser({
        email: 'admin@aalayamhospital.com',
        firstName: 'Hospital',
        lastName: 'Admin',
        role: Role.HOSPITAL_ADMIN,
        branchId: branch.id,
        departmentId: null,
        scopeKey: branch.id,
      });

      // 3. Doctor (Dr. Rajesh Kumar)
      const doctorUser = await setupStaffUser({
        email: 'doctor@aalayamhospital.com',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        role: Role.DOCTOR,
        branchId: branch.id,
        departmentId: deptGenMed.id,
        scopeKey: `${branch.id}:${deptGenMed.id}`,
      });

      let doctorEmp = await tx.employee.findUnique({ where: { userId: doctorUser.id } });
      if (!doctorEmp) {
        doctorEmp = await tx.employee.create({
          data: {
            userId: doctorUser.id,
            hospitalId: hospital.id,
            branchId: branch.id,
            departmentId: deptGenMed.id,
            employeeCode: 'EMP-DOC-001',
            designation: 'Senior Consultant',
            dateOfJoining: new Date(),
            status: 'ACTIVE',
          },
        });
      }

      let doctorProfile = await tx.doctor.findUnique({ where: { employeeId: doctorEmp.id } });
      if (!doctorProfile) {
        doctorProfile = await tx.doctor.create({
          data: {
            employeeId: doctorEmp.id,
            hospitalId: hospital.id,
            branchId: branch.id,
            departmentId: deptGenMed.id,
            designation: 'GENERAL_PHYSICIAN',
            licenseNumber: 'DOC-TN-2026-001',
            specialization: 'General Medicine',
            experienceYears: 10,
            consultationFee: 500,
            followUpFee: 300,
            opdFee: 500,
            isAvailableToday: true,
            availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
          },
        });
      }

      // 4. Staff Nurse (Kavitha Murugan)
      const nurseUser = await setupStaffUser({
        email: 'nurse@aalayamhospital.com',
        firstName: 'Kavitha',
        lastName: 'Murugan',
        role: Role.NURSE,
        branchId: branch.id,
        departmentId: deptGenMed.id,
        scopeKey: `${branch.id}:${deptGenMed.id}`,
      });

      let nurseEmp = await tx.employee.findUnique({ where: { userId: nurseUser.id } });
      if (!nurseEmp) {
        nurseEmp = await tx.employee.create({
          data: {
            userId: nurseUser.id,
            hospitalId: hospital.id,
            branchId: branch.id,
            departmentId: deptGenMed.id,
            employeeCode: 'EMP-NUR-001',
            designation: 'Staff Nurse',
            dateOfJoining: new Date(),
            status: 'ACTIVE',
          },
        });
      }

      let nurseProfile = await tx.nursingStaff.findUnique({ where: { employeeId: nurseEmp.id } });
      if (!nurseProfile) {
        nurseProfile = await tx.nursingStaff.create({
          data: {
            employeeId: nurseEmp.id,
            hospitalId: hospital.id,
            branchId: branch.id,
            isHeadNurse: false,
            shift: 'DAY',
          },
        });
      }

      // 5. Head Nurse (Priya Natarajan)
      const headNurseUser = await setupStaffUser({
        email: 'headnurse@aalayamhospital.com',
        firstName: 'Priya',
        lastName: 'Natarajan',
        role: Role.HEAD_NURSE,
        branchId: branch.id,
        departmentId: deptGenMed.id,
        scopeKey: `${branch.id}:${deptGenMed.id}`,
      });

      let headNurseEmp = await tx.employee.findUnique({ where: { userId: headNurseUser.id } });
      if (!headNurseEmp) {
        headNurseEmp = await tx.employee.create({
          data: {
            userId: headNurseUser.id,
            hospitalId: hospital.id,
            branchId: branch.id,
            departmentId: deptGenMed.id,
            employeeCode: 'EMP-HN-001',
            designation: 'Head Nurse / Supervisor',
            dateOfJoining: new Date(),
            status: 'ACTIVE',
          },
        });
      }

      let headNurseProfile = await tx.nursingStaff.findUnique({ where: { employeeId: headNurseEmp.id } });
      if (!headNurseProfile) {
        headNurseProfile = await tx.nursingStaff.create({
          data: {
            employeeId: headNurseEmp.id,
            hospitalId: hospital.id,
            branchId: branch.id,
            isHeadNurse: true,
            shift: 'DAY',
          },
        });
      }

      // 6. Receptionist (Priya Dharshini)
      const recUser = await setupStaffUser({
        email: 'receptionist@aalayamhospital.com',
        firstName: 'Priya',
        lastName: 'Dharshini',
        role: Role.RECEPTIONIST,
        branchId: branch.id,
        departmentId: null,
        scopeKey: branch.id,
      });

      let recEmp = await tx.employee.findUnique({ where: { userId: recUser.id } });
      if (!recEmp) {
        await tx.employee.create({
          data: {
            userId: recUser.id,
            hospitalId: hospital.id,
            branchId: branch.id,
            departmentId: deptGenMed.id,
            employeeCode: 'EMP-REC-001',
            designation: 'Front Desk Executive',
            dateOfJoining: new Date(),
            status: 'ACTIVE',
          },
        });
      }

      // 7. Pharmacist
      await setupStaffUser({
        email: 'pharmacist@aalayamhospital.com',
        firstName: 'Karthik',
        lastName: 'Raja',
        role: Role.PHARMACIST,
        branchId: branch.id,
        departmentId: null,
        scopeKey: branch.id,
      });

      // 8. Lab Technician
      await setupStaffUser({
        email: 'lab@aalayamhospital.com',
        firstName: 'Suresh',
        lastName: 'Babu',
        role: Role.LAB_TECHNICIAN,
        branchId: branch.id,
        departmentId: null,
        scopeKey: branch.id,
      });

      // 9. Patients
      const patientUser1 = await setupStaffUser({
        email: 'patient@aalayamhospital.com',
        firstName: 'Ramesh',
        lastName: 'Kannan',
        role: Role.PATIENT,
        branchId: null,
        departmentId: null,
        scopeKey: 'GLOBAL',
      });

      let patient1 = await tx.patient.findUnique({ where: { uhid: 'UHID-2026-0001' } });
      if (!patient1) {
        patient1 = await tx.patient.create({
          data: {
            uhid: 'UHID-2026-0001',
            userId: patientUser1.id,
            hospitalId: hospital.id,
            registrationBranchId: branch.id,
            firstName: 'Ramesh',
            lastName: 'Kannan',
            dateOfBirth: new Date('1988-05-15'),
            gender: 'MALE',
            bloodGroup: 'O_POSITIVE',
            phone: '+91 9876543211',
            email: 'patient@aalayamhospital.com',
            addressLine1: '45 Lake View Road',
            city: 'Madurai',
            state: 'Tamil Nadu',
            postalCode: '625002',
            emergencyContactName: 'Meena Kannan',
            emergencyContactPhone: '+91 9876543212',
            emergencyContactRelation: 'Spouse',
            allergies: ['Penicillin'],
          },
        });
      }

      let patient2 = await tx.patient.findUnique({ where: { uhid: 'UHID-2026-0002' } });
      if (!patient2) {
        patient2 = await tx.patient.create({
          data: {
            uhid: 'UHID-2026-0002',
            hospitalId: hospital.id,
            registrationBranchId: branch.id,
            firstName: 'Lakshmi',
            lastName: 'Devi',
            dateOfBirth: new Date('1994-08-22'),
            gender: 'FEMALE',
            bloodGroup: 'B_POSITIVE',
            phone: '+91 9876543213',
            email: 'lakshmi.devi@example.com',
            addressLine1: '12 Temple Street',
            city: 'Madurai',
            state: 'Tamil Nadu',
            postalCode: '625001',
            emergencyContactName: 'Sundaram',
            emergencyContactPhone: '+91 9876543214',
            emergencyContactRelation: 'Brother',
            allergies: ['Sulfa drugs'],
          },
        });
      }

      // 10. Wards & Beds (For Nurse Workspace)
      let iccuWard = await tx.ward.findFirst({ where: { hospitalId: hospital.id, code: 'ICCU' } });
      if (!iccuWard) {
        iccuWard = await tx.ward.create({
          data: {
            hospitalId: hospital.id,
            branchId: branch.id,
            departmentId: deptCardio.id,
            name: 'Intensive Coronary Care Unit',
            code: 'ICCU',
            genderAllowed: 'ANY',
            floorNumber: 2,
            totalBeds: 4,
            occupiedBeds: 1,
          },
        });
      }

      let genWard = await tx.ward.findFirst({ where: { hospitalId: hospital.id, code: 'GEN_M' } });
      if (!genWard) {
        genWard = await tx.ward.create({
          data: {
            hospitalId: hospital.id,
            branchId: branch.id,
            departmentId: deptGenMed.id,
            name: 'General Medical Ward',
            code: 'GEN_M',
            genderAllowed: 'ANY',
            floorNumber: 1,
            totalBeds: 8,
            occupiedBeds: 0,
          },
        });
      }

      // Beds
      let bed1 = await tx.bed.findFirst({ where: { wardId: iccuWard.id, bedNumber: '101' } });
      if (!bed1) {
        bed1 = await tx.bed.create({
          data: {
            hospitalId: hospital.id,
            branchId: branch.id,
            wardId: iccuWard.id,
            roomNumber: 'ICCU-01',
            bedNumber: '101',
            type: 'ICU',
            status: 'OCCUPIED',
            dailyRate: 3500,
            currentPatientId: patient1.id,
            currentPatientName: 'Ramesh Kannan',
          },
        });
      }

      let bed2 = await tx.bed.findFirst({ where: { wardId: iccuWard.id, bedNumber: '102' } });
      if (!bed2) {
        await tx.bed.create({
          data: {
            hospitalId: hospital.id,
            branchId: branch.id,
            wardId: iccuWard.id,
            roomNumber: 'ICCU-01',
            bedNumber: '102',
            type: 'ICU',
            status: 'AVAILABLE',
            dailyRate: 3500,
          },
        });
      }

      // 11. Nurse Ward Assignment
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const existingAssignment = await tx.nursingAssignment.findFirst({
        where: { nurseId: nurseProfile.id, wardId: iccuWard.id, assignedDate: todayDate },
      });
      if (!existingAssignment) {
        await tx.nursingAssignment.create({
          data: {
            hospitalId: hospital.id,
            branchId: branch.id,
            nurseId: nurseProfile.id,
            wardId: iccuWard.id,
            assignedDate: todayDate,
            shift: 'DAY',
          },
        });
      }

      // 12. Active Inpatient Admission (for Nurse Workspace testing)
      let admission1 = await tx.admission.findUnique({ where: { admissionNumber: 'ADM-2026-0001' } });
      if (!admission1) {
        admission1 = await tx.admission.create({
          data: {
            admissionNumber: 'ADM-2026-0001',
            hospitalId: hospital.id,
            branchId: branch.id,
            patientId: patient1.id,
            admittingDoctorId: doctorProfile.id,
            wardId: iccuWard.id,
            bedId: bed1.id,
            status: 'ADMITTED',
            admissionReason: 'Severe acute exacerbation of bronchial asthma with dyspnea',
            initialDiagnosis: 'Acute Bronchial Asthma (J45.901)',
            admittedAt: new Date(Date.now() - 24 * 3600 * 1000), // admitted yesterday
          },
        });
      }

      // 13. Vitals Record for Patient 1
      const vitalsCount = await tx.vitalsRecord.count({ where: { patientId: patient1.id } });
      if (vitalsCount === 0) {
        await tx.vitalsRecord.create({
          data: {
            hospitalId: hospital.id,
            branchId: branch.id,
            patientId: patient1.id,
            admissionId: admission1.id,
            recordedByUserId: nurseUser.id,
            temperature: 99.1,
            systolicBp: 130,
            diastolicBp: 85,
            pulseRate: 94,
            respiratoryRate: 22,
            oxygenSaturation: 95,
            bloodSugarMgDl: 126,
            isAbnormal: false,
            notes: 'Patient resting comfortably. Wheezing slightly improved post-nebulization.',
          },
        });
      }

      // 14. Nursing Tasks
      const taskCount = await tx.nursingTask.count({ where: { admissionId: admission1.id } });
      if (taskCount === 0) {
        await tx.nursingTask.createMany({
          data: [
            {
              hospitalId: hospital.id,
              branchId: branch.id,
              patientId: patient1.id,
              admissionId: admission1.id,
              assignedNurseId: nurseProfile.id,
              taskTitle: 'Monitor Vitals & SpO2 Q2H',
              taskDescription: 'Record temperature, BP, pulse, and oxygen saturation every 2 hours.',
              dueTime: new Date(Date.now() + 2 * 3600 * 1000),
              isCompleted: false,
            },
            {
              hospitalId: hospital.id,
              branchId: branch.id,
              patientId: patient1.id,
              admissionId: admission1.id,
              assignedNurseId: nurseProfile.id,
              taskTitle: 'Nebulization Therapy',
              taskDescription: 'Administer Duolin + Budecort respules nebulization as per physician order.',
              dueTime: new Date(Date.now() + 1 * 3600 * 1000),
              isCompleted: false,
            },
          ],
        });
      }

      // 15. OPD Appointments for Today (For Receptionist Live Queue testing)
      const apt1 = await tx.appointment.findUnique({ where: { appointmentNumber: 'APT-2026-0001' } });
      if (!apt1) {
        await tx.appointment.create({
          data: {
            appointmentNumber: 'APT-2026-0001',
            hospitalId: hospital.id,
            branchId: branch.id,
            patientId: patient1.id,
            doctorId: doctorProfile.id,
            departmentId: deptGenMed.id,
            appointmentDate: todayDate,
            appointmentTime: '10:00',
            tokenNumber: 1,
            status: 'CHECKED_IN',
            type: 'OPD',
            priority: 'ROUTINE',
            reasonForVisit: 'General health checkup and routine follow-up',
            consultationFee: 500,
            isPaid: true,
            checkInAt: new Date(),
          },
        });
      }

      const apt2 = await tx.appointment.findUnique({ where: { appointmentNumber: 'APT-2026-0002' } });
      if (!apt2) {
        await tx.appointment.create({
          data: {
            appointmentNumber: 'APT-2026-0002',
            hospitalId: hospital.id,
            branchId: branch.id,
            patientId: patient2.id,
            doctorId: doctorProfile.id,
            departmentId: deptGenMed.id,
            appointmentDate: todayDate,
            appointmentTime: '10:30',
            tokenNumber: 2,
            status: 'SCHEDULED',
            type: 'OPD',
            priority: 'ROUTINE',
            reasonForVisit: 'Migraine and episodic tension headache',
            consultationFee: 500,
            isPaid: false,
          },
        });
      }

      // 16. Master Data
      await tx.masterDataSet.createMany({
        data: systemData.map(({ key, name }) => ({ scope: 'SYSTEM', key, name, isSystem: true })),
        skipDuplicates: true,
      });
      const sets = await tx.masterDataSet.findMany({
        where: { scope: 'SYSTEM', key: { in: systemData.map(set => set.key) } },
        select: { id: true, key: true, hospitalId: true, isSystem: true },
      });
      const setsByKey = new Map(sets.map(set => [set.key, set]));
      const items = systemData.flatMap(({ key, codes }) => {
        const set = setsByKey.get(key);
        if (!set) return [];
        return codes.map((code, sortOrder) => ({
          setId: set.id,
          code,
          name: code.replaceAll('_', ' '),
          sortOrder,
        }));
      });
      await tx.masterDataItem.createMany({
        data: items,
        skipDuplicates: true,
      });

      console.log('Seeding completed successfully!');
    });
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
