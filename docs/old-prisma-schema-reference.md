# Old HMS Prisma Schema Reference

Read-only extraction of the old project prisma/schema.prisma. Each enum and model declaration is reproduced verbatim, including all fields, types, attributes, defaults, relations, relation names, referential actions, unique constraints, indexes, mapped names, and comments. No environment configuration is included.

## Extraction verification

- Source lines read: 1055
- Enums captured: 1
- Models captured: 49
- Total declarations: 50
- All declaration blocks were brace-balanced and names were unique.

### Enum names

AccountAccessPurpose

### Model names

Hospital, Branch, Department, User, Role, HospitalRolePolicy, AccountAccessToken, Permission, UserRole, RolePermission, RefreshToken, Employee, Doctor, DoctorQualification, DoctorSchedule, DoctorLeave, Patient, PatientDocument, Appointment, Consultation, Prescription, PrescriptionItem, NursingStaff, NursingAssignment, VitalsRecord, NursingTask, MedicationAdministration, LabTest, TestParameter, LabOrder, LabOrderItem, LabResult, Medicine, MedicineBatch, DispensingRecord, RadiologyTest, RadiologyOrder, Ward, Bed, Admission, Invoice, InvoiceItem, Payment, InsuranceClaim, Ambulance, AmbulanceDriver, AmbulanceTrip, Notification, AuditLog

## Enum definitions

### AccountAccessPurpose (source lines 168-171)

```prisma
enum AccountAccessPurpose {
  INVITATION
  RESET
}
```

## Model definitions (groups of five)

### Group 1: Hospital through Role

#### Hospital (source lines 14-46)

```prisma
model Hospital {
  id            String       @id @default(uuid())
  name          String
  code          String       @unique
  tamilName     String?
  addressLine1  String
  addressLine2  String?
  city          String
  state         String
  postalCode    String
  country       String       @default("India")
  phone         String
  emergencyPhone String?
  email         String
  website       String?
  licenseNumber String       @unique
  verificationStatus String  @default("UNVERIFIED")
  isActive      Boolean      @default(true)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  deletedAt     DateTime?

  branches      Branch[]
  departments   Department[]
  users         User[]
  patients      Patient[]
  wards         Ward[]
  ambulances    Ambulance[]
  auditLogs     AuditLog[]
  rolePolicies  HospitalRolePolicy[]

  @@index([code])
}
```

#### Branch (source lines 48-82)

```prisma
model Branch {
  id           String     @id @default(uuid())
  hospitalId   String
  hospital     Hospital   @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  name         String
  code         String     @unique
  city         String
  address      String
  phone        String
  type               String?
  description        String?
  contactPerson      String?
  email              String?
  alternatePhone     String?
  addressLine2       String?
  district           String?
  state              String?
  country            String?
  pincode            String?
  registrationNumber String?
  licenseNumber      String?
  gstNumber          String?
  openingDate        String?
  workingHours       String?
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  deletedAt    DateTime?

  users        User[]
  employees    Employee[]
  departments  Department[]

  @@index([hospitalId])
}
```

#### Department (source lines 84-107)

```prisma
model Department {
  id                 String       @id @default(uuid())
  hospitalId         String
  hospital           Hospital     @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  branchId           String?
  branch             Branch?      @relation(fields: [branchId], references: [id], onDelete: Restrict)
  name               String
  code               String
  description        String?
  headOfDepartmentId String?
  isActive           Boolean      @default(true)
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
  deletedAt          DateTime?

  employees          Employee[]
  doctors            Doctor[]
  appointments       Appointment[]
  wards              Ward[]

  @@unique([hospitalId, code])
  @@index([hospitalId])
  @@index([hospitalId, branchId])
}
```

#### User (source lines 113-142)

```prisma
model User {
  id              String      @id @default(uuid())
  hospitalId      String?
  hospital        Hospital?   @relation(fields: [hospitalId], references: [id], onDelete: SetNull)
  branchId        String?
  branch          Branch?     @relation(fields: [branchId], references: [id], onDelete: SetNull)
  email           String      @unique
  passwordHash    String
  firstName       String
  lastName        String
  phone           String?
  avatarUrl       String?
  isActive        Boolean     @default(true)
  lastLoginAt     DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  deletedAt       DateTime?

  userRoles       UserRole[]
  employee        Employee?
  patient         Patient?
  notifications   Notification[]
  auditLogs       AuditLog[]
  refreshTokens   RefreshToken[]
  accessTokens    AccountAccessToken[] @relation("AccessTokenRecipient")
  issuedAccessTokens AccountAccessToken[] @relation("AccessTokenIssuer")

  @@index([email])
  @@index([hospitalId])
}
```

#### Role (source lines 144-154)

```prisma
model Role {
  id              String           @id @default(uuid())
  name            String           @unique // e.g. DOCTOR, NURSE, SUPER_ADMIN
  description     String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  userRoles       UserRole[]
  rolePermissions RolePermission[]
  hospitalPolicies HospitalRolePolicy[]
}
```

### Group 2: HospitalRolePolicy through RolePermission

#### HospitalRolePolicy (source lines 156-166)

```prisma
model HospitalRolePolicy {
  hospitalId String
  hospital Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  roleId String
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  grants String[]
  updatedAt DateTime @updatedAt

  @@id([hospitalId, roleId])
  @@index([roleId])
}
```

#### AccountAccessToken (source lines 173-188)

```prisma
model AccountAccessToken {
  id String @id @default(uuid())
  digest String @unique
  userId String
  user User @relation("AccessTokenRecipient", fields: [userId], references: [id], onDelete: Cascade)
  issuedById String?
  issuedBy User? @relation("AccessTokenIssuer", fields: [issuedById], references: [id], onDelete: SetNull)
  purpose AccountAccessPurpose
  expiresAt DateTime
  redeemedAt DateTime?
  revokedAt DateTime?
  createdAt DateTime @default(now())

  @@index([userId, purpose])
  @@index([issuedById])
}
```

#### Permission (source lines 190-201)

```prisma
model Permission {
  id              String           @id @default(uuid())
  resource        String           // e.g. PATIENTS, PRESCRIPTIONS
  action          String           // e.g. VIEW, CREATE, APPROVE, RELEASE
  description     String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  rolePermissions RolePermission[]

  @@unique([resource, action])
}
```

#### UserRole (source lines 203-213)

```prisma
model UserRole {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleId    String
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, roleId])
  @@index([userId])
}
```

#### RolePermission (source lines 215-225)

```prisma
model RolePermission {
  id           String     @id @default(uuid())
  roleId       String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now())

  @@unique([roleId, permissionId])
  @@index([roleId])
}
```

### Group 3: RefreshToken through DoctorSchedule

#### RefreshToken (source lines 227-237)

```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId])
}
```

#### Employee (source lines 243-265)

```prisma
model Employee {
  id               String          @id @default(uuid())
  userId           String          @unique
  user             User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  branchId         String?
  branch           Branch?         @relation(fields: [branchId], references: [id], onDelete: SetNull)
  departmentId     String?
  department       Department?     @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  employeeCode     String          @unique
  designation      String
  employmentType   String          @default("FULL_TIME") // FULL_TIME, PART_TIME, CONTRACT
  dateOfJoining    DateTime
  salary           Decimal?        @db.Decimal(12, 2)
  status           String          @default("ACTIVE")
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  doctor           Doctor?
  nursingProfile   NursingStaff?
  ambulanceDriver  AmbulanceDriver?

  @@index([employeeCode])
}
```

#### Doctor (source lines 267-301)

```prisma
model Doctor {
  id                     String                 @id @default(uuid())
  employeeId             String                 @unique
  employee               Employee               @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  departmentId           String
  department             Department             @relation(fields: [departmentId], references: [id], onDelete: Restrict)
  designation            String                 // GENERAL_PHYSICIAN, SPECIALIST, SURGEON, DUTY_DOCTOR, RESIDENT_DOCTOR, INTERN
  licenseNumber          String                 @unique
  specialization         String
  subSpecialization      String?
  experienceYears        Int                    @default(0)
  consultationFee        Decimal                @default(500.00) @db.Decimal(10, 2)
  followUpFee            Decimal                @default(300.00) @db.Decimal(10, 2)
  opdFee                 Decimal                @default(500.00) @db.Decimal(10, 2)
  ipdAvailable           Boolean                @default(true)
  consultationDurationMin Int                   @default(15)
  availableDays          String[]               // e.g. ["MON", "TUE", "WED", "THU", "FRI", "SAT"]
  shift                  String                 @default("MORNING") // MORNING, EVENING, NIGHT, ROTATING
  isAvailableToday       Boolean                @default(true)
  createdAt              DateTime               @default(now())
  updatedAt              DateTime               @updatedAt

  qualifications         DoctorQualification[]
  schedules              DoctorSchedule[]
  leaves                 DoctorLeave[]
  appointments           Appointment[]
  consultations          Consultation[]
  prescriptions          Prescription[]
  labOrders              LabOrder[]
  radiologyOrders        RadiologyOrder[]
  admissions             Admission[]

  @@index([departmentId])
  @@index([designation])
}
```

#### DoctorQualification (source lines 303-313)

```prisma
model DoctorQualification {
  id          String   @id @default(uuid())
  doctorId    String
  doctor      Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  degree      String   // MBBS, MD, MS, DM, MCh, DNB
  institution String
  yearPassed  Int
  createdAt   DateTime @default(now())

  @@index([doctorId])
}
```

#### DoctorSchedule (source lines 315-327)

```prisma
model DoctorSchedule {
  id          String   @id @default(uuid())
  doctorId    String
  doctor      Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  dayOfWeek   String   // MONDAY, TUESDAY...
  startTime   String   // "09:00"
  endTime     String   // "13:00"
  maxPatients Int      @default(25)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@index([doctorId])
}
```

### Group 4: DoctorLeave through Consultation

#### DoctorLeave (source lines 329-340)

```prisma
model DoctorLeave {
  id        String   @id @default(uuid())
  doctorId  String
  doctor    Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  startDate DateTime
  endDate   DateTime
  reason    String
  isApproved Boolean @default(false)
  createdAt DateTime @default(now())

  @@index([doctorId])
}
```

#### Patient (source lines 346-391)

```prisma
model Patient {
  id                       String               @id @default(uuid())
  uhid                     String               @unique // ALY-YYYY-XXXX
  userId                   String?              @unique
  user                     User?                @relation(fields: [userId], references: [id], onDelete: SetNull)
  hospitalId               String
  hospital                 Hospital             @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  firstName                String
  lastName                 String
  dateOfBirth              DateTime
  gender                   String               // MALE, FEMALE, OTHER
  bloodGroup               String?              // A_POSITIVE, O_POSITIVE etc.
  phone                    String
  email                    String?
  nationalId               String?              // Aadhaar / Passport
  addressLine1             String
  addressLine2             String?
  city                     String
  state                    String
  postalCode               String
  country                  String               @default("India")
  emergencyContactName     String
  emergencyContactPhone    String
  emergencyContactRelation String
  allergies                String[]
  medicalHistoryNotes      String?
  createdAt                DateTime             @default(now())
  updatedAt                DateTime             @updatedAt
  deletedAt                DateTime?

  appointments             Appointment[]
  consultations            Consultation[]
  prescriptions            Prescription[]
  vitalsRecords            VitalsRecord[]
  nursingTasks             NursingTask[]
  labOrders                LabOrder[]
  radiologyOrders          RadiologyOrder[]
  admissions               Admission[]
  invoices                 Invoice[]
  insuranceClaims          InsuranceClaim[]
  patientDocuments         PatientDocument[]

  @@index([uhid])
  @@index([phone])
  @@index([hospitalId])
}
```

#### PatientDocument (source lines 393-404)

```prisma
model PatientDocument {
  id           String   @id @default(uuid())
  patientId    String
  patient      Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  title        String
  documentType String   // ID_PROOF, DISCHARGE_SUMMARY, LAB_REPORT, SCAN, OTHER
  fileUrl      String
  uploadedBy   String
  createdAt    DateTime @default(now())

  @@index([patientId])
}
```

#### Appointment (source lines 410-439)

```prisma
model Appointment {
  id                String         @id @default(uuid())
  appointmentNumber String         @unique // APT-YYYY-XXXX
  patientId         String
  patient           Patient        @relation(fields: [patientId], references: [id], onDelete: Restrict)
  doctorId          String
  doctor            Doctor         @relation(fields: [doctorId], references: [id], onDelete: Restrict)
  departmentId      String
  department        Department     @relation(fields: [departmentId], references: [id], onDelete: Restrict)
  appointmentDate   DateTime       @db.Date
  appointmentTime   String         // "10:30"
  tokenNumber       Int
  status            String         @default("SCHEDULED") // SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED
  type              String         @default("OPD") // OPD, FOLLOW_UP, EMERGENCY
  priority          String         @default("ROUTINE") // ROUTINE, URGENT, STAT_EMERGENCY
  reasonForVisit    String
  consultationFee   Decimal        @db.Decimal(10, 2)
  isPaid            Boolean        @default(false)
  checkInAt         DateTime?
  completedAt       DateTime?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  consultation      Consultation?
  invoices          Invoice[]

  @@index([patientId])
  @@index([doctorId, appointmentDate])
  @@index([appointmentNumber])
}
```

#### Consultation (source lines 445-469)

```prisma
model Consultation {
  id                       String         @id @default(uuid())
  appointmentId            String         @unique
  appointment              Appointment    @relation(fields: [appointmentId], references: [id], onDelete: Restrict)
  patientId                String
  patient                  Patient        @relation(fields: [patientId], references: [id], onDelete: Restrict)
  doctorId                 String
  doctor                   Doctor         @relation(fields: [doctorId], references: [id], onDelete: Restrict)
  chiefComplaint           String
  historyOfPresentIllness  String?
  physicalExamNotes        String?
  diagnosisNotes           String
  icd10Codes               String[]
  treatmentPlan            String
  followUpDate             DateTime?      @db.Date
  status                   String         @default("COMPLETED")
  admissionRecommended    Boolean        @default(false)
  createdAt                DateTime       @default(now())
  updatedAt                DateTime       @updatedAt

  prescriptions            Prescription[]

  @@index([patientId])
  @@index([doctorId])
}
```

### Group 5: Prescription through VitalsRecord

#### Prescription (source lines 471-490)

```prisma
model Prescription {
  id                 String             @id @default(uuid())
  prescriptionNumber String             @unique // RX-YYYY-XXXX
  patientId          String
  patient            Patient            @relation(fields: [patientId], references: [id], onDelete: Restrict)
  doctorId           String
  doctor             Doctor             @relation(fields: [doctorId], references: [id], onDelete: Restrict)
  consultationId     String?
  consultation       Consultation?      @relation(fields: [consultationId], references: [id], onDelete: SetNull)
  notes              String?
  dispensingStatus   String             @default("PENDING") // PENDING, PARTIALLY_DISPENSED, DISPENSED
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  items              PrescriptionItem[]
  dispensingRecords  DispensingRecord[]

  @@index([patientId])
  @@index([doctorId])
}
```

#### PrescriptionItem (source lines 492-510)

```prisma
model PrescriptionItem {
  id                 String       @id @default(uuid())
  prescriptionId     String
  prescription       Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  medicineId         String
  medicine           Medicine     @relation(fields: [medicineId], references: [id], onDelete: Restrict)
  dosage             String       // e.g. "650 mg"
  frequency          String       // e.g. "1-0-1"
  durationDays       Int          // e.g. 5
  instructions       String       // e.g. "After food"
  route              String       @default("Oral")
  dispensedQuantity  Int          @default(0)
  createdAt          DateTime     @default(now())

  medicationAdmins   MedicationAdministration[]

  @@index([prescriptionId])
  @@index([medicineId])
}
```

#### NursingStaff (source lines 516-529)

```prisma
model NursingStaff {
  id           String              @id @default(uuid())
  employeeId   String              @unique
  employee     Employee            @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  isHeadNurse  Boolean             @default(false)
  shift        String              @default("DAY") // DAY, NIGHT, ROTATING
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt

  assignments  NursingAssignment[]
  nursingTasks NursingTask[]

  @@index([employeeId])
}
```

#### NursingAssignment (source lines 531-543)

```prisma
model NursingAssignment {
  id           String       @id @default(uuid())
  nurseId      String
  nurse        NursingStaff @relation(fields: [nurseId], references: [id], onDelete: Cascade)
  wardId       String
  ward         Ward         @relation(fields: [wardId], references: [id], onDelete: Cascade)
  assignedDate DateTime     @db.Date
  shift        String
  createdAt    DateTime     @default(now())

  @@index([nurseId])
  @@index([wardId])
}
```

#### VitalsRecord (source lines 545-567)

```prisma
model VitalsRecord {
  id               String     @id @default(uuid())
  patientId        String
  patient          Patient    @relation(fields: [patientId], references: [id], onDelete: Cascade)
  admissionId      String?
  admission        Admission? @relation(fields: [admissionId], references: [id], onDelete: SetNull)
  recordedByUserId String
  temperature      Decimal?   @db.Decimal(5, 2) // Fahrenheit
  systolicBp       Int?       // mmHg
  diastolicBp      Int?       // mmHg
  pulseRate        Int?       // bpm
  respiratoryRate  Int?       // breaths/min
  oxygenSaturation Int?       // %
  bloodSugarMgDl   Int?       // mg/dL
  weightKg         Decimal?   @db.Decimal(5, 2)
  heightCm         Decimal?   @db.Decimal(5, 2)
  isAbnormal       Boolean    @default(false)
  notes            String?
  createdAt        DateTime   @default(now())

  @@index([patientId])
  @@index([admissionId])
}
```

### Group 6: NursingTask through LabOrder

#### NursingTask (source lines 569-587)

```prisma
model NursingTask {
  id              String        @id @default(uuid())
  patientId       String
  patient         Patient       @relation(fields: [patientId], references: [id], onDelete: Cascade)
  admissionId     String
  admission       Admission     @relation(fields: [admissionId], references: [id], onDelete: Cascade)
  assignedNurseId String?
  assignedNurse   NursingStaff? @relation(fields: [assignedNurseId], references: [id], onDelete: SetNull)
  taskTitle       String
  taskDescription String
  dueTime         DateTime
  isCompleted     Boolean       @default(false)
  completedAt     DateTime?
  priority        String        @default("ROUTINE")
  createdAt       DateTime      @default(now())

  @@index([patientId])
  @@index([admissionId])
}
```

#### MedicationAdministration (source lines 589-602)

```prisma
model MedicationAdministration {
  id                 String           @id @default(uuid())
  prescriptionItemId String
  prescriptionItem   PrescriptionItem @relation(fields: [prescriptionItemId], references: [id], onDelete: Cascade)
  admissionId        String
  admission          Admission        @relation(fields: [admissionId], references: [id], onDelete: Cascade)
  nurseId            String
  administeredDose   String
  administeredAt     DateTime         @default(now())
  notes              String?

  @@index([prescriptionItemId])
  @@index([admissionId])
}
```

#### LabTest (source lines 608-621)

```prisma
model LabTest {
  id           String          @id @default(uuid())
  testCode     String          @unique
  name         String
  category     String          // HEMATOLOGY, BIOCHEMISTRY, MICROBIOLOGY...
  sampleType   String          // BLOOD, URINE, SERUM, CSF
  price        Decimal         @db.Decimal(10, 2)
  tatHours     Int             @default(24) // Turnaround time in hours
  isActive     Boolean         @default(true)
  createdAt    DateTime        @default(now())

  parameters   TestParameter[]
  orderItems   LabOrderItem[]
}
```

#### TestParameter (source lines 623-638)

```prisma
model TestParameter {
  id             String      @id @default(uuid())
  labTestId      String
  labTest        LabTest     @relation(fields: [labTestId], references: [id], onDelete: Cascade)
  parameterName  String
  unit           String
  referenceLow   Decimal?    @db.Decimal(8, 2)
  referenceHigh  Decimal?    @db.Decimal(8, 2)
  criticalLow    Decimal?    @db.Decimal(8, 2)
  criticalHigh   Decimal?    @db.Decimal(8, 2)
  normalRangeStr String?

  results        LabResult[]

  @@index([labTestId])
}
```

#### LabOrder (source lines 640-662)

```prisma
model LabOrder {
  id               String         @id @default(uuid())
  orderNumber      String         @unique // LAB-YYYY-XXXX
  patientId        String
  patient          Patient        @relation(fields: [patientId], references: [id], onDelete: Restrict)
  doctorId         String
  doctor           Doctor         @relation(fields: [doctorId], references: [id], onDelete: Restrict)
  status           String         @default("ORDERED") // ORDERED, COLLECTED, RECEIVED_IN_LAB, PROCESSING, COMPLETED, REJECTED
  priority         String         @default("ROUTINE")
  barcode          String         @unique
  sampleCollectedAt DateTime?
  reportReleasedAt DateTime?
  releasedByUserId String?
  clinicalNotes    String?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  orderItems       LabOrderItem[]
  results          LabResult[]

  @@index([patientId])
  @@index([orderNumber])
}
```

### Group 7: LabOrderItem through DispensingRecord

#### LabOrderItem (source lines 664-674)

```prisma
model LabOrderItem {
  id         String   @id @default(uuid())
  labOrderId String
  labOrder   LabOrder @relation(fields: [labOrderId], references: [id], onDelete: Cascade)
  labTestId  String
  labTest    LabTest  @relation(fields: [labTestId], references: [id], onDelete: Restrict)
  createdAt  DateTime @default(now())

  @@index([labOrderId])
  @@index([labTestId])
}
```

#### LabResult (source lines 676-692)

```prisma
model LabResult {
  id              String        @id @default(uuid())
  labOrderId      String
  labOrder        LabOrder      @relation(fields: [labOrderId], references: [id], onDelete: Cascade)
  parameterId     String
  parameter       TestParameter @relation(fields: [parameterId], references: [id], onDelete: Restrict)
  measuredValue   String
  unit            String
  referenceRange  String
  isAbnormal      Boolean       @default(false)
  isCritical      Boolean       @default(false)
  remarks         String?
  technicianNotes String?
  enteredAt       DateTime      @default(now())

  @@index([labOrderId])
}
```

#### Medicine (source lines 698-719)

```prisma
model Medicine {
  id                String             @id @default(uuid())
  code              String             @unique
  brandName         String
  genericName       String
  category          String             // ANTIBIOTIC, ANALGESIC, ANTIHYPERTENSIVE...
  strength          String             // 500mg, 10ml, etc.
  dosageForm        String             // TABLET, CAPSULE, SYRUP, INJECTION, OINTMENT
  manufacturer      String
  unitPrice         Decimal            @db.Decimal(10, 2)
  currentStock      Int                @default(0)
  reorderLevel      Int                @default(20)
  isActive          Boolean            @default(true)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  batches           MedicineBatch[]
  prescriptionItems PrescriptionItem[]

  @@index([brandName])
  @@index([genericName])
}
```

#### MedicineBatch (source lines 721-737)

```prisma
model MedicineBatch {
  id                String             @id @default(uuid())
  medicineId        String
  medicine          Medicine           @relation(fields: [medicineId], references: [id], onDelete: Cascade)
  batchNumber       String
  expiryDate        DateTime           @db.Date
  quantity          Int
  purchasePrice     Decimal            @db.Decimal(10, 2)
  sellingPrice      Decimal            @db.Decimal(10, 2)
  createdAt         DateTime           @default(now())

  dispensingRecords DispensingRecord[]

  @@unique([medicineId, batchNumber])
  @@index([medicineId])
  @@index([expiryDate])
}
```

#### DispensingRecord (source lines 739-751)

```prisma
model DispensingRecord {
  id                String        @id @default(uuid())
  prescriptionId    String
  prescription      Prescription  @relation(fields: [prescriptionId], references: [id], onDelete: Restrict)
  batchId           String
  batch             MedicineBatch @relation(fields: [batchId], references: [id], onDelete: Restrict)
  dispensedQuantity Int
  pharmacistUserId  String
  dispensedAt       DateTime      @default(now())

  @@index([prescriptionId])
  @@index([batchId])
}
```

### Group 8: RadiologyTest through Admission

#### RadiologyTest (source lines 757-767)

```prisma
model RadiologyTest {
  id         String           @id @default(uuid())
  testCode   String           @unique
  name       String           // Chest X-Ray, Brain MRI, CT Abdomen...
  modality   String           // XRAY, CT, MRI, ULTRASOUND, PET
  price      Decimal          @db.Decimal(10, 2)
  isActive   Boolean          @default(true)
  createdAt  DateTime         @default(now())

  orders     RadiologyOrder[]
}
```

#### RadiologyOrder (source lines 769-792)

```prisma
model RadiologyOrder {
  id                 String        @id @default(uuid())
  orderNumber        String        @unique // RAD-YYYY-XXXX
  patientId          String
  patient            Patient       @relation(fields: [patientId], references: [id], onDelete: Restrict)
  doctorId           String
  doctor             Doctor        @relation(fields: [doctorId], references: [id], onDelete: Restrict)
  testId             String
  test               RadiologyTest @relation(fields: [testId], references: [id], onDelete: Restrict)
  priority           String        @default("ROUTINE")
  status             String        @default("ORDERED") // ORDERED, SCHEDULED, PROCEDURE_COMPLETED, REPORT_RELEASED
  clinicalIndication String
  findings           String?
  impression         String?
  criticalAlert      Boolean       @default(false)
  imageUrl           String?
  reportReleasedAt   DateTime?
  releasedByUserId   String?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  @@index([patientId])
  @@index([orderNumber])
}
```

#### Ward (source lines 798-819)

```prisma
model Ward {
  id            String              @id @default(uuid())
  hospitalId    String
  hospital      Hospital            @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  departmentId  String?
  department    Department?         @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  name          String
  code          String
  genderAllowed String              @default("ANY") // MALE, FEMALE, ANY
  floorNumber   Int                 @default(1)
  totalBeds     Int                 @default(0)
  occupiedBeds  Int                 @default(0)
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  beds          Bed[]
  admissions    Admission[]
  nurseAssigns  NursingAssignment[]

  @@unique([hospitalId, code])
  @@index([hospitalId])
}
```

#### Bed (source lines 821-840)

```prisma
model Bed {
  id                 String      @id @default(uuid())
  wardId             String
  ward               Ward        @relation(fields: [wardId], references: [id], onDelete: Cascade)
  roomNumber         String
  bedNumber          String
  type               String      @default("STANDARD") // STANDARD, SEMI_PRIVATE, PRIVATE, DELUXE, ICU, CCU
  status             String      @default("AVAILABLE") // AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, CLEANING
  dailyRate          Decimal     @default(1000.00) @db.Decimal(10, 2)
  currentPatientId   String?
  currentPatientName String?
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt

  admissions         Admission[]

  @@unique([wardId, roomNumber, bedNumber])
  @@index([wardId])
  @@index([status])
}
```

#### Admission (source lines 842-870)

```prisma
model Admission {
  id                 String                     @id @default(uuid())
  admissionNumber    String                     @unique // ADM-YYYY-XXXX
  patientId          String
  patient            Patient                    @relation(fields: [patientId], references: [id], onDelete: Restrict)
  admittingDoctorId  String
  admittingDoctor    Doctor                     @relation(fields: [admittingDoctorId], references: [id], onDelete: Restrict)
  wardId             String
  ward               Ward                       @relation(fields: [wardId], references: [id], onDelete: Restrict)
  bedId              String
  bed                Bed                        @relation(fields: [bedId], references: [id], onDelete: Restrict)
  status             String                     @default("ADMITTED") // ADMITTED, DISCHARGED, TRANSFERRED
  admissionReason    String
  initialDiagnosis   String
  admittedAt         DateTime                   @default(now())
  dischargedAt       DateTime?
  dischargeSummary   String?
  createdAt          DateTime                   @default(now())
  updatedAt          DateTime                   @updatedAt

  vitals             VitalsRecord[]
  nursingTasks       NursingTask[]
  medicationAdmins   MedicationAdministration[]
  invoices           Invoice[]

  @@index([patientId])
  @@index([bedId])
  @@index([admissionNumber])
}
```

### Group 9: Invoice through Ambulance

#### Invoice (source lines 876-901)

```prisma
model Invoice {
  id             String           @id @default(uuid())
  invoiceNumber  String           @unique // INV-YYYY-XXXX
  patientId      String
  patient        Patient          @relation(fields: [patientId], references: [id], onDelete: Restrict)
  admissionId    String?
  admission      Admission?       @relation(fields: [admissionId], references: [id], onDelete: SetNull)
  appointmentId  String?
  appointment    Appointment?     @relation(fields: [appointmentId], references: [id], onDelete: SetNull)
  subTotal       Decimal          @db.Decimal(12, 2)
  taxAmount      Decimal          @default(0.00) @db.Decimal(12, 2)
  discountAmount Decimal          @default(0.00) @db.Decimal(12, 2)
  totalAmount    Decimal          @db.Decimal(12, 2)
  paidAmount     Decimal          @default(0.00) @db.Decimal(12, 2)
  status         String           @default("PENDING") // PENDING, PARTIALLY_PAID, PAID, CANCELLED
  notes          String?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  items          InvoiceItem[]
  payments       Payment[]
  claims         InsuranceClaim[]

  @@index([patientId])
  @@index([invoiceNumber])
}
```

#### InvoiceItem (source lines 903-916)

```prisma
model InvoiceItem {
  id                 String   @id @default(uuid())
  invoiceId          String
  invoice            Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description        String
  category           String   // CONSULTATION, LAB, RADIOLOGY, PHARMACY, ROOM, PROCEDURE
  quantity           Int      @default(1)
  unitPrice          Decimal  @db.Decimal(10, 2)
  discountPercentage Decimal  @default(0.00) @db.Decimal(5, 2)
  totalPrice         Decimal  @db.Decimal(10, 2)
  createdAt          DateTime @default(now())

  @@index([invoiceId])
}
```

#### Payment (source lines 918-931)

```prisma
model Payment {
  id                   String   @id @default(uuid())
  invoiceId            String
  invoice              Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  amount               Decimal  @db.Decimal(12, 2)
  paymentMethod        String   // CASH, CARD, UPI, NET_BANKING, INSURANCE
  transactionReference String?
  paymentStatus        String   @default("SUCCESS")
  receivedByUserId     String
  notes                String?
  createdAt            DateTime @default(now())

  @@index([invoiceId])
}
```

#### InsuranceClaim (source lines 933-951)

```prisma
model InsuranceClaim {
  id             String    @id @default(uuid())
  claimNumber    String    @unique
  invoiceId      String
  invoice        Invoice   @relation(fields: [invoiceId], references: [id], onDelete: Restrict)
  patientId      String
  patient        Patient   @relation(fields: [patientId], references: [id], onDelete: Restrict)
  providerName   String    // Star Health, Medi Assist, ICICI Lombard...
  policyNumber   String
  preAuthCode    String?
  claimAmount    Decimal   @db.Decimal(12, 2)
  approvedAmount Decimal?  @db.Decimal(12, 2)
  status         String    @default("SUBMITTED") // SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, SETTLED
  submittedAt    DateTime  @default(now())
  settledAt      DateTime?

  @@index([invoiceId])
  @@index([patientId])
}
```

#### Ambulance (source lines 957-973)

```prisma
model Ambulance {
  id             String          @id @default(uuid())
  hospitalId     String
  hospital       Hospital        @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  vehicleNumber  String          @unique // e.g. TN-58-AB-1234
  model          String
  type           String          @default("ADVANCED_LIFE_SUPPORT") // BASIC, ADVANCED_LIFE_SUPPORT
  isAvailable    Boolean         @default(true)
  currentGpsLat  Decimal?        @db.Decimal(10, 6)
  currentGpsLng  Decimal?        @db.Decimal(10, 6)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  trips          AmbulanceTrip[]

  @@index([vehicleNumber])
}
```

### Group 10: AmbulanceDriver through AuditLog

#### AmbulanceDriver (source lines 975-988)

```prisma
model AmbulanceDriver {
  id            String          @id @default(uuid())
  employeeId    String          @unique
  employee      Employee        @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  licenseNumber String          @unique
  phone         String
  isOnDuty      Boolean         @default(true)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  trips         AmbulanceTrip[]

  @@index([licenseNumber])
}
```

#### AmbulanceTrip (source lines 990-1015)

```prisma
model AmbulanceTrip {
  id                      String           @id @default(uuid())
  tripCode                String           @unique // AMB-YYYY-XXXX
  ambulanceId             String
  ambulance               Ambulance        @relation(fields: [ambulanceId], references: [id], onDelete: Restrict)
  driverId                String
  driver                  AmbulanceDriver  @relation(fields: [driverId], references: [id], onDelete: Restrict)
  callerName              String
  callerPhone             String
  pickupLocation          String
  destinationHospital     String           @default("Aalayam Multispeciality Hospital - Main Campus")
  severity                String           @default("CRITICAL") // CRITICAL, HIGH, MODERATE, LOW
  status                  String           @default("DISPATCHED") // DISPATCHED, EN_ROUTE_PICKUP, ARRIVED_AT_SCENE, PATIENT_LOADED, EN_ROUTE_HOSPITAL, ARRIVED_HOSPITAL, HANDOVER_COMPLETE
  patientConditionSummary String
  handoverNotes           String?
  dispatchedAt            DateTime         @default(now())
  arrivedSceneAt          DateTime?
  arrivedHospitalAt       DateTime?
  completedAt             DateTime?
  createdAt               DateTime         @default(now())
  updatedAt               DateTime         @updatedAt

  @@index([tripCode])
  @@index([ambulanceId])
  @@index([driverId])
}
```

#### Notification (source lines 1021-1033)

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  message   String
  type      String   // APPOINTMENT, LAB_RESULT, EMERGENCY, ADMISSION, PRESCRIPTION
  isRead    Boolean  @default(false)
  linkUrl   String?
  createdAt DateTime @default(now())

  @@index([userId])
}
```

#### AuditLog (source lines 1035-1055)

```prisma
model AuditLog {
  id         String    @id @default(uuid())
  hospitalId String?
  hospital   Hospital? @relation(fields: [hospitalId], references: [id], onDelete: SetNull)
  userId     String?
  user       User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  userEmail  String
  userRole   String
  action     String    // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, APPROVE, RELEASE, EXPORT
  resource   String    // PATIENT, CONSULTATION, PRESCRIPTION, BILLING, USER...
  resourceId String?
  ipAddress  String?
  userAgent  String?
  details    Json?
  createdAt  DateTime  @default(now())

  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
}
```
