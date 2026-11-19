# Aalayam HMS — Database Architecture & ER Design

## 1. Database Philosophy

The Aalayam HMS relational schema is built on **PostgreSQL** via **Prisma ORM**. It adheres to clinical data governance standards:
- **UUID Primary Keys**: Every entity uses `@id @default(uuid())` preventing enumeration attacks.
- **Audit Columns**: Every table contains `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
- **Soft Deletes**: Critical clinical records utilize `deletedAt DateTime?` to prevent accidental loss of medical data.
- **Multi-Hospital & Branch Scope**: All departmental, staff, and patient records are scoped to `hospitalId` and optional `branchId`.
- **Referential Integrity**: Cascades, restricted deletes on medical records, and unique constraint guarantees.

---

## 2. Core Relational Domains

### 1. Hospital, Administration & RBAC
- `Hospital`: Root entity storing organization details, state registration, contact and Tamil name.
- `Branch`: Physical satellite branches (e.g. Madurai Main Campus, Chennai City Campus).
- `Department`: Clinical wings (Cardiology, Neurology, Orthopaedics, General Medicine, etc.).
- `User`: Central credential and profile record.
- `Role`: 16 defined hospital role groups.
- `Permission`: Fine-grained actions (`RESOURCE:ACTION`).
- `UserRole` & `RolePermission`: Many-to-many junction mappings.
- `RefreshToken`: Cryptographic session store for transparent token rotation.

### 2. Employees & Doctors
- `Employee`: HR employment codes, dates of joining, department assignments.
- `Doctor`: Clinical profile, designation (`GENERAL_PHYSICIAN`, `SURGEON`, `SPECIALIST`, `DUTY_DOCTOR`, `RESIDENT`, `INTERN`), license number, consultation fees, experience, available shifts.
- `DoctorQualification`: Degrees (`MBBS`, `MD`, `MS`, `MCh`, `DM`), medical institutions, and passing years.
- `DoctorSchedule`: Weekly day-wise OPD time slots and patient quotas.

### 3. Patients & Outpatient Care (OPD)
- `Patient`: Unique UHID (`ALY-YYYY-XXXX`), demographics, phone, national ID, emergency contacts, persistent allergies, past history.
- `Appointment`: Number (`APT-YYYY-XXXX`), patient link, doctor link, date, time slot, token number, status (`SCHEDULED`, `CHECKED_IN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
- `Consultation`: Chief complaints, examination notes, provisional diagnosis, ICD-10 codes, treatment plan, follow-up date, admission recommendations.
- `Prescription` & `PrescriptionItem`: Number (`RX-YYYY-XXXX`), medicine link, dosage, frequency (`1-0-1`), duration in days, administration instructions (`After food`), route (`Oral`, `IV`), dispensing status.

### 4. Inpatient Care (IPD), Wards & Nursing
- `Ward`: Name, code, floor number, gender restriction, bed counts, department link.
- `Bed`: Ward link, room number, bed number (`ICCU-01`), bed type (`ICU`, `STANDARD`, `PRIVATE`), status (`AVAILABLE`, `OCCUPIED`, `CLEANING`, `MAINTENANCE`), daily rate.
- `Admission`: Number (`ADM-YYYY-XXXX`), patient link, doctor link, bed link, admitted timestamp, reason, diagnosis, discharge summary.
- `VitalsRecord`: Temperature, Systolic/Diastolic BP, Pulse rate, Respiration, SpO2 %, Blood Sugar, Weight, Height, abnormal flag.
- `NursingTask`: Care instructions, due time, priority, nurse assignment, completion flag.
- `MedicationAdministration`: Inpatient MAR verification, administered dose, nurse timestamp.

### 5. Diagnostics: Laboratory & Radiology
- `LabTest` & `TestParameter`: Test code (`LAB-CBC`), sample type (`Blood`), reference ranges (low, high, critical boundaries), turnaround time.
- `LabOrder`, `LabOrderItem` & `LabResult`: Number (`LAB-YYYY-XXXX`), unique specimen barcode, measured values, abnormal & critical alert flags, release timestamp.
- `RadiologyTest` & `RadiologyOrder`: Modality (`XRAY`, `CT`, `MRI`, `USG`), clinical indication, radiological findings, impression, critical alert, and report release.

### 6. Pharmacy & Formulary Inventory
- `Medicine`: Code, brand name, generic name, strength, dosage form, manufacturer, unit price, stock on hand, reorder thresholds.
- `MedicineBatch`: Batch number, expiry date (FEFO rule), quantity, unit cost.
- `DispensingRecord`: Transaction log linking prescription item, batch, quantity, and dispensing pharmacist.

### 7. Billing, Invoices & Insurance Claims
- `Invoice` & `InvoiceItem`: Number (`INV-YYYY-XXXX`), itemized breakdowns (Consultation, Room, Lab, Pharmacy, Procedure), subtotals, tax, discounts, paid amount.
- `Payment`: Cash, UPI, Card, Net Banking transactions, cashier receipt logs.
- `InsuranceClaim`: TPA provider, policy number, claim amount, approval status (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `SETTLED`).

### 8. Emergency Medical Dispatch (Ambulance)
- `Ambulance`: Vehicle registration number, cardiac ALS type, availability status, GPS coordinates.
- `AmbulanceDriver`: Licensed driver profile, duty status.
- `AmbulanceTrip`: Code (`AMB-YYYY-XXXX`), caller contact, pickup address, severity (`CRITICAL`), timeline (`DISPATCHED` -> `EN_ROUTE_PICKUP` -> `ARRIVED_AT_SCENE` -> `PATIENT_LOADED` -> `EN_ROUTE_HOSPITAL` -> `HANDOVER_COMPLETE`).

---

## 3. Database Migration Guidelines for the 10-Member Team

1. **Schema Ownership**:
   - **Member 1 (Admin/Database Lead)** has exclusive write access to `prisma/schema.prisma` and `prisma/migrations/`.
2. **Feature Changes**:
   - Other members document their entity/column requests in their feature branches.
   - Member 1 reviews and incorporates changes into the shared schema, runs `pnpm db:migrate` and commits the clean migration.
3. **No Branch Migration Conflicts**:
   - Never run `prisma migrate dev` on a feature branch without pulling from `origin/develop` first.
