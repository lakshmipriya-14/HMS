import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding comprehensive realistic hospital data (without "Demo" labels)...');

  const hospital = await prisma.hospital.findFirst({ where: { code: 'UYIRINAI' } });
  if (!hospital) throw new Error('Hospital UYIRINAI not found.');

  const branch = await prisma.branch.findFirst({ where: { hospitalId: hospital.id, code: 'MAIN' } });
  if (!branch) throw new Error('Branch MAIN not found.');

  // Update Branch name to real name
  await prisma.branch.update({
    where: { id: branch.id },
    data: { name: 'Madurai Main Campus', address: '123 Healthcare Avenue, KK Nagar, Madurai' },
  });

  // 1. All Medical Departments
  const departmentsData = [
    { code: 'GENMED', name: 'General Medicine', description: 'Internal medicine, adult healthcare, chronic disease management' },
    { code: 'CARD', name: 'Cardiology', description: 'Interventional cardiology, heart rhythm disorders, preventative heart care' },
    { code: 'PED', name: 'Pediatrics', description: 'Child development, neonatal care, pediatric critical care' },
    { code: 'ORTHO', name: 'Orthopedics', description: 'Joint replacement, arthroscopic surgery, sports medicine, trauma care' },
    { code: 'NEURO', name: 'Neurology', description: 'Stroke care, epilepsy, movement disorders, neuro-rehabilitation' },
    { code: 'GYN', name: 'Gynecology & Obstetrics', description: 'Maternity care, fetal medicine, laparoscopic gynecologic surgery' },
    { code: 'DERM', name: 'Dermatology', description: 'Clinical dermatology, pediatric dermatology, cutaneous allergies' },
    { code: 'ENT', name: 'ENT (Otorhinolaryngology)', description: 'Ear, nose, throat, head & neck surgery, audiology' },
    { code: 'OPHTH', name: 'Ophthalmology', description: 'Comprehensive eye care, cataract surgery, glaucoma, retina' },
    { code: 'SURG', name: 'General Surgery', description: 'Minimally invasive laparoscopic surgery, abdominal trauma' },
    { code: 'NEPH', name: 'Nephrology', description: 'Kidney disorders, dialysis, hypertensive nephropathy' },
  ];

  const depts = {};
  for (const d of departmentsData) {
    const row = await prisma.department.upsert({
      where: { hospitalId_code: { hospitalId: hospital.id, code: d.code } },
      update: { name: d.name, description: d.description, branchId: branch.id, isActive: true },
      create: { hospitalId: hospital.id, branchId: branch.id, code: d.code, name: d.name, description: d.description, isActive: true },
    });
    depts[d.code] = row;
  }

  const doctorRole = await prisma.role.findFirst({ where: { name: 'DOCTOR' } });
  const patientRole = await prisma.role.findFirst({ where: { name: 'PATIENT' } });
  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 2. Realistic Doctors across all departments
  const doctorFixtures = [
    {
      email: 'dr.arun@uyirinai.com',
      firstName: 'Arunachalam',
      lastName: 'Swaminathan',
      phone: '+919876500101',
      deptCode: 'GENMED',
      designation: 'GENERAL_PHYSICIAN',
      specialization: 'General Medicine',
      experienceYears: 14,
      gender: 'MALE',
      consultationFee: 500,
      bio: 'Senior Consultant in Internal Medicine with 14+ years of clinical excellence in treating diabetes, hypertension, metabolic disorders, and acute medical illnesses.',
      qualifications: [
        { degree: 'MBBS', institution: 'Madras Medical College', yearPassed: 2009 },
        { degree: 'MD - General Medicine', institution: 'AIIMS New Delhi', yearPassed: 2013 },
      ],
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
      bio: 'Chief Interventional Cardiologist specializing in adult coronary angiography, angioplasty, heart failure management, and preventive cardiovascular wellness.',
      qualifications: [
        { degree: 'MBBS', institution: 'Stanley Medical College', yearPassed: 2007 },
        { degree: 'MD - General Medicine', institution: 'JIPMER Pondicherry', yearPassed: 2011 },
        { degree: 'DM - Cardiology', institution: 'Sri Ramachandra Medical College', yearPassed: 2015 },
      ],
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
      experienceYears: 11,
      gender: 'FEMALE',
      consultationFee: 600,
      bio: 'Compassionate Consultant Pediatrician specializing in infant nutrition, childhood vaccinations, asthma management, and developmental milestones.',
      qualifications: [
        { degree: 'MBBS', institution: 'Madurai Medical College', yearPassed: 2012 },
        { degree: 'DCH', institution: 'Institute of Child Health Chennai', yearPassed: 2015 },
        { degree: 'DNB - Pediatrics', institution: 'Apollo Hospitals', yearPassed: 2018 },
      ],
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
      bio: 'Senior Joint Replacement & Arthroscopy Surgeon with extensive fellowship training in total knee, hip reconstruction, and sports injury management.',
      qualifications: [
        { degree: 'MBBS', institution: 'Kilpauk Medical College', yearPassed: 2005 },
        { degree: 'MS - Orthopedics', institution: 'CMC Vellore', yearPassed: 2009 },
        { degree: 'Fellowship Joint Replacement', institution: 'Royal College of Surgeons', yearPassed: 2012 },
      ],
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
      experienceYears: 15,
      gender: 'MALE',
      consultationFee: 1000,
      bio: 'Lead Neurologist specializing in acute ischemic stroke treatment, complex epilepsy, neuropathies, Parkinsonism, and chronic migraine therapies.',
      qualifications: [
        { degree: 'MBBS', institution: 'PSG Institute of Medical Sciences', yearPassed: 2008 },
        { degree: 'MD - General Medicine', institution: 'Madras Medical College', yearPassed: 2012 },
        { degree: 'DM - Neurology', institution: 'NIMHANS Bangalore', yearPassed: 2016 },
      ],
      schedules: [
        { dayOfWeek: 'MONDAY', startTime: '14:00', endTime: '19:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '14:00', endTime: '19:00' },
        { dayOfWeek: 'FRIDAY', startTime: '14:00', endTime: '19:00' },
      ],
    },
    {
      email: 'dr.meenakshi@uyirinai.com',
      firstName: 'Meenakshi',
      lastName: 'Sundaresan',
      phone: '+919876500106',
      deptCode: 'GYN',
      designation: 'SPECIALIST',
      specialization: 'Gynecology & Obstetrics',
      experienceYears: 17,
      gender: 'FEMALE',
      consultationFee: 750,
      bio: 'Senior Consultant Obstetrician and Gynecologist with expertise in high-risk pregnancies, adolescent gynecology, and advanced laparoscopic surgery.',
      qualifications: [
        { degree: 'MBBS', institution: 'Thanjavur Medical College', yearPassed: 2006 },
        { degree: 'MS - Obstetrics & Gynaecology', institution: 'Madras Medical College', yearPassed: 2010 },
        { degree: 'Fellowship Minimally Invasive Surgery', institution: 'IMA AKN Sinha Institute', yearPassed: 2013 },
      ],
      schedules: [
        { dayOfWeek: 'MONDAY', startTime: '09:30', endTime: '15:30' },
        { dayOfWeek: 'TUESDAY', startTime: '09:30', endTime: '15:30' },
        { dayOfWeek: 'WEDNESDAY', startTime: '09:30', endTime: '15:30' },
        { dayOfWeek: 'THURSDAY', startTime: '09:30', endTime: '15:30' },
        { dayOfWeek: 'FRIDAY', startTime: '09:30', endTime: '15:30' },
      ],
    },
    {
      email: 'dr.anandhan@uyirinai.com',
      firstName: 'Anandhan',
      lastName: 'Natarajan',
      phone: '+919876500107',
      deptCode: 'SURG',
      designation: 'SPECIALIST',
      specialization: 'General Surgery',
      experienceYears: 20,
      gender: 'MALE',
      consultationFee: 950,
      bio: 'Senior Laparoscopic and General Surgeon with over 20 years performing minimally invasive hernia repairs, gall bladder surgery, and GI procedures.',
      qualifications: [
        { degree: 'MBBS', institution: 'Stanley Medical College', yearPassed: 2003 },
        { degree: 'MS - General Surgery', institution: 'Madurai Medical College', yearPassed: 2007 },
        { degree: 'FMAS - Laparoscopic Surgery', institution: 'World Laparoscopy Hospital', yearPassed: 2010 },
      ],
      schedules: [
        { dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '16:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '10:00', endTime: '16:00' },
        { dayOfWeek: 'SATURDAY', startTime: '10:00', endTime: '16:00' },
      ],
    },
    {
      email: 'dr.kavitha@uyirinai.com',
      firstName: 'Kavitha',
      lastName: 'Rajendran',
      phone: '+919876500108',
      deptCode: 'DERM',
      designation: 'SPECIALIST',
      specialization: 'Dermatology',
      experienceYears: 10,
      gender: 'FEMALE',
      consultationFee: 650,
      bio: 'Dermatologist and Cosmetologist dedicated to managing eczema, psoriasis, acne, pigmentary disorders, and laser aesthetic procedures.',
      qualifications: [
        { degree: 'MBBS', institution: 'Coimbatore Medical College', yearPassed: 2013 },
        { degree: 'MD - Dermatology & Venereology', institution: 'JIPMER Pondicherry', yearPassed: 2017 },
      ],
      schedules: [
        { dayOfWeek: 'TUESDAY', startTime: '13:00', endTime: '18:00' },
        { dayOfWeek: 'THURSDAY', startTime: '13:00', endTime: '18:00' },
        { dayOfWeek: 'SATURDAY', startTime: '13:00', endTime: '18:00' },
      ],
    },
    {
      email: 'dr.balasubramanian@uyirinai.com',
      firstName: 'Balasubramanian',
      lastName: 'Muthusamy',
      phone: '+919876500109',
      deptCode: 'ENT',
      designation: 'SPECIALIST',
      specialization: 'ENT (Otorhinolaryngology)',
      experienceYears: 13,
      gender: 'MALE',
      consultationFee: 700,
      bio: 'Consultant ENT Surgeon specializing in endoscopic sinus surgery, tympanoplasty, allergy treatment, and snoring/sleep apnea management.',
      qualifications: [
        { degree: 'MBBS', institution: 'Madras Medical College', yearPassed: 2010 },
        { degree: 'MS - ENT', institution: 'Postgraduate Institute Chandigarh', yearPassed: 2014 },
      ],
      schedules: [
        { dayOfWeek: 'MONDAY', startTime: '08:30', endTime: '13:30' },
        { dayOfWeek: 'TUESDAY', startTime: '08:30', endTime: '13:30' },
        { dayOfWeek: 'WEDNESDAY', startTime: '08:30', endTime: '13:30' },
        { dayOfWeek: 'THURSDAY', startTime: '08:30', endTime: '13:30' },
        { dayOfWeek: 'FRIDAY', startTime: '08:30', endTime: '13:30' },
      ],
    },
    {
      email: 'dr.deepa@uyirinai.com',
      firstName: 'Deepa',
      lastName: 'Chandrasekaran',
      phone: '+919876500110',
      deptCode: 'OPHTH',
      designation: 'SPECIALIST',
      specialization: 'Ophthalmology',
      experienceYears: 12,
      gender: 'FEMALE',
      consultationFee: 600,
      bio: 'Ophthalmic Surgeon focused on phacoemulsification cataract surgery, refractive errors, diabetic retinopathy screening, and pediatric vision care.',
      qualifications: [
        { degree: 'MBBS', institution: 'Stanley Medical College', yearPassed: 2011 },
        { degree: 'MS - Ophthalmology', institution: 'Aravind Eye Hospital', yearPassed: 2015 },
      ],
      schedules: [
        { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '14:00' },
        { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '14:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '14:00' },
        { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '14:00' },
        { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '14:00' },
        { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '14:00' },
      ],
    },
    {
      email: 'dr.vijayaraghavan@uyirinai.com',
      firstName: 'Vijayaraghavan',
      lastName: 'Ramamurthy',
      phone: '+919876500111',
      deptCode: 'NEPH',
      designation: 'SPECIALIST',
      specialization: 'Nephrology',
      experienceYears: 22,
      gender: 'MALE',
      consultationFee: 1100,
      bio: 'Chief Nephrologist and Transplant Physician with over two decades of experience in chronic kidney disease, hemodialysis protocols, and glomerulonephritis.',
      qualifications: [
        { degree: 'MBBS', institution: 'Madras Medical College', yearPassed: 2000 },
        { degree: 'MD - General Medicine', institution: 'JIPMER Pondicherry', yearPassed: 2004 },
        { degree: 'DM - Nephrology', institution: 'CMC Vellore', yearPassed: 2008 },
      ],
      schedules: [
        { dayOfWeek: 'TUESDAY', startTime: '14:00', endTime: '18:30' },
        { dayOfWeek: 'THURSDAY', startTime: '14:00', endTime: '18:30' },
        { dayOfWeek: 'FRIDAY', startTime: '14:00', endTime: '18:30' },
      ],
    },
    {
      email: 'dr.sangeetha@uyirinai.com',
      firstName: 'Sangeetha',
      lastName: 'Krishnan',
      phone: '+919876500112',
      deptCode: 'GENMED',
      designation: 'GENERAL_PHYSICIAN',
      specialization: 'General Medicine',
      experienceYears: 8,
      gender: 'FEMALE',
      consultationFee: 500,
      bio: 'General Physician dedicated to family practice, acute fevers, respiratory infections, hypertension screening, and preventive health checks.',
      qualifications: [
        { degree: 'MBBS', institution: 'Madurai Medical College', yearPassed: 2015 },
        { degree: 'MD - Family Medicine', institution: 'Christian Medical College', yearPassed: 2019 },
      ],
      schedules: [
        { dayOfWeek: 'MONDAY', startTime: '16:00', endTime: '20:00' },
        { dayOfWeek: 'TUESDAY', startTime: '16:00', endTime: '20:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '16:00', endTime: '20:00' },
        { dayOfWeek: 'THURSDAY', startTime: '16:00', endTime: '20:00' },
        { dayOfWeek: 'FRIDAY', startTime: '16:00', endTime: '20:00' },
        { dayOfWeek: 'SATURDAY', startTime: '16:00', endTime: '20:00' },
      ],
    },
  ];

  // Also clean up any existing "Demo DOCTOR" users by giving them realistic names
  const existingDoctors = await prisma.doctor.findMany({
    include: { employee: { include: { user: true } } },
  });

  const fallbackNames = [
    { first: 'Manickam', last: 'Velusamy' },
    { first: 'Saranya', last: 'Devi' },
    { first: 'Hariprasad', last: 'Narayanan' },
    { first: 'Gayathri', last: 'Ramesh' },
    { first: 'Venkatesh', last: 'Prabhu' },
  ];

  for (let i = 0; i < existingDoctors.length; i++) {
    const d = existingDoctors[i];
    const u = d.employee?.user;
    if (u && (u.firstName?.includes('Demo') || u.lastName?.includes('DOCTOR'))) {
      const fb = fallbackNames[i % fallbackNames.length];
      await prisma.user.update({
        where: { id: u.id },
        data: { firstName: fb.first, lastName: fb.last },
      });
      await prisma.doctor.update({
        where: { id: d.id },
        data: {
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
          experienceYears: 10 + i * 2,
          bio: 'Experienced clinical consultant providing comprehensive healthcare services and patient-centered care.',
        },
      });
    }
  }

  // Insert or update all 12 realistic doctors
  const doctorsMap = {};
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
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firstName: doc.firstName, lastName: doc.lastName, phone: doc.phone },
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
    } else {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { designation: doc.designation, departmentId: depts[doc.deptCode].id },
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
          data: { doctorId: doctor.id, degree: q.degree, institution: q.institution, yearPassed: q.yearPassed },
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
      } else {
        await prisma.doctorSchedule.update({
          where: { id: existingS.id },
          data: { startTime: s.startTime, endTime: s.endTime },
        });
      }
    }

    doctorsMap[doc.deptCode] = doctor;
  }

  // 3. Update Patient Profile (clean, realistic name)
  let patientUser = await prisma.user.findUnique({ where: { email: 'patient@demo.uyirinai.test' } });
  if (patientUser) {
    await prisma.user.update({
      where: { id: patientUser.id },
      data: { firstName: 'Lakshmi', lastName: 'Sundaram', phone: '+919876543210' },
    });
  }

  const patient = await prisma.patient.findFirst({ where: { userId: patientUser?.id } });
  if (patient) {
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        firstName: 'Lakshmi',
        lastName: 'Sundaram',
        uhid: 'KZN-2026-0042',
        gender: 'FEMALE',
        dateOfBirth: new Date('1990-08-14T00:00:00Z'),
        bloodGroup: 'O_POSITIVE',
        phone: '+919876543210',
        email: 'lakshmi.sundaram@gmail.com',
        addressLine1: '42 Bharathiyar Salai, Anna Nagar',
        addressLine2: 'Near Gandhi Memorial Museum',
        city: 'Madurai',
        state: 'Tamil Nadu',
        postalCode: '625020',
        emergencyContactName: 'Sundaram Rajan',
        emergencyContactPhone: '+919876543219',
        emergencyContactRelation: 'Spouse',
        allergies: ['Penicillin', 'Dust Mites'],
        medicalHistoryNotes: 'Seasonal respiratory sensitivity; annual cardiology wellness checkup.',
      },
    });
  }

  // 4. Update existing appointments to use real doctors
  if (patient) {
    const cardDoc = doctorsMap['CARD'] || doctorsMap['GENMED'];
    const genDoc = doctorsMap['GENMED'];

    // Update active appointments
    const activeApts = await prisma.appointment.findMany({
      where: { patientId: patient.id, status: 'SCHEDULED' },
    });

    if (activeApts.length >= 1 && genDoc) {
      await prisma.appointment.update({
        where: { id: activeApts[0].id },
        data: {
          doctorId: genDoc.id,
          departmentId: depts['GENMED'].id,
          reasonForVisit: 'General health checkup and blood pressure review',
        },
      });
    }

    if (activeApts.length >= 2 && cardDoc) {
      await prisma.appointment.update({
        where: { id: activeApts[1].id },
        data: {
          doctorId: cardDoc.id,
          departmentId: depts['CARD'].id,
          reasonForVisit: 'Preventive cardiovascular assessment and ECG review',
        },
      });
    }

    // Update notifications with clean realistic text
    await prisma.notification.deleteMany({ where: { userId: patientUser.id } });

    await prisma.notification.createMany({
      data: [
        {
          userId: patientUser.id,
          hospitalId: hospital.id,
          branchId: branch.id,
          type: 'APPOINTMENT_REMINDER',
          title: 'Upcoming Appointment in 2 Days',
          message: 'Reminder: You have a consultation with Dr. Priya Soundararajan (Cardiology) scheduled in 2 days at 11:00 AM.',
          isRead: false,
        },
        {
          userId: patientUser.id,
          hospitalId: hospital.id,
          branchId: branch.id,
          type: 'APPOINTMENT_REMINDER',
          title: 'Appointment Reminder - Tomorrow',
          message: 'Reminder: Tomorrow you have an appointment with Dr. Arunachalam Swaminathan (General Medicine) at 10:30 AM (IST).',
          isRead: false,
        },
        {
          userId: patientUser.id,
          hospitalId: hospital.id,
          branchId: branch.id,
          type: 'APPOINTMENT_REMINDER',
          title: 'Appointment Today at 10:30 AM',
          message: 'Your consultation with Dr. Arunachalam Swaminathan is scheduled today at 10:30 AM. Token #4.',
          isRead: false,
        },
        {
          userId: patientUser.id,
          hospitalId: hospital.id,
          branchId: branch.id,
          type: 'APPOINTMENT',
          title: 'Consultation Confirmed by Department Admin',
          message: 'Department Admin has scheduled and confirmed your consultation with Dr. Priya Soundararajan. Reference #KZN-APT-882.',
          isRead: false,
        },
        {
          userId: patientUser.id,
          hospitalId: hospital.id,
          branchId: branch.id,
          type: 'LAB_RESULT',
          title: 'Diagnostic Lab Report Released',
          message: 'Your Complete Blood Count (CBC) and Lipid Profile report has been verified by the Chief Pathologist.',
          isRead: true,
        },
        {
          userId: patientUser.id,
          hospitalId: hospital.id,
          branchId: branch.id,
          type: 'PRESCRIPTION',
          title: 'Prescription Ready for Pickup',
          message: 'Prescription PRX-2026-0812 has been dispensed by the Hospital Pharmacy.',
          isRead: true,
        },
      ],
    });
  }

  console.log('Seeding completed! 12 realistic doctors across 11 departments, updated patient, and notifications.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
