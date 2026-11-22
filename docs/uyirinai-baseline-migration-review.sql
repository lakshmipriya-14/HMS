-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountAccessPurpose" AS ENUM ('INVITATION', 'RESET');

-- CreateEnum
CREATE TYPE "MasterDataScope" AS ENUM ('SYSTEM', 'HOSPITAL');

-- CreateEnum
CREATE TYPE "ReportExportStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('OPENING_BALANCE', 'DISPENSE', 'DISPENSE_REVERSAL');

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "tamilName" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "phone" TEXT NOT NULL,
    "emergencyPhone" TEXT,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "inventoryLedgerCutoverAt" TIMESTAMP(3),

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "alternatePhone" TEXT,
    "addressLine2" TEXT,
    "district" TEXT,
    "state" TEXT,
    "country" TEXT,
    "pincode" TEXT,
    "registrationNumber" TEXT,
    "licenseNumber" TEXT,
    "gstNumber" TEXT,
    "openingDate" TEXT,
    "workingHours" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "headOfDepartmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalRolePolicy" (
    "hospitalId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grants" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalRolePolicy_pkey" PRIMARY KEY ("hospitalId","roleId")
);

-- CreateTable
CREATE TABLE "AccountAccessToken" (
    "id" TEXT NOT NULL,
    "digest" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issuedById" TEXT,
    "purpose" "AccountAccessPurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "branchId" TEXT,
    "departmentId" TEXT,
    "scopeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "departmentId" TEXT,
    "employeeCode" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "dateOfJoining" TIMESTAMP(3) NOT NULL,
    "salary" DECIMAL(12,2),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "subSpecialization" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "consultationFee" DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    "followUpFee" DECIMAL(10,2) NOT NULL DEFAULT 300.00,
    "opdFee" DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    "ipdAvailable" BOOLEAN NOT NULL DEFAULT true,
    "consultationDurationMin" INTEGER NOT NULL DEFAULT 15,
    "availableDays" TEXT[],
    "shift" TEXT NOT NULL DEFAULT 'MORNING',
    "isAvailableToday" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorQualification" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "yearPassed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorSchedule" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maxPatients" INTEGER NOT NULL DEFAULT 25,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorLeave" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorLeave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "uhid" TEXT NOT NULL,
    "userId" TEXT,
    "hospitalId" TEXT NOT NULL,
    "registrationBranchId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "nationalId" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "emergencyContactRelation" TEXT NOT NULL,
    "allergies" TEXT[],
    "medicalHistoryNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientDocument" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "appointmentNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "appointmentDate" DATE NOT NULL,
    "appointmentTime" TEXT NOT NULL,
    "tokenNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "type" TEXT NOT NULL DEFAULT 'OPD',
    "priority" TEXT NOT NULL DEFAULT 'ROUTINE',
    "reasonForVisit" TEXT NOT NULL,
    "consultationFee" DECIMAL(10,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "checkInAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "chiefComplaint" TEXT NOT NULL,
    "historyOfPresentIllness" TEXT,
    "physicalExamNotes" TEXT,
    "diagnosisNotes" TEXT NOT NULL,
    "icd10Codes" TEXT[],
    "treatmentPlan" TEXT NOT NULL,
    "followUpDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "admissionRecommended" BOOLEAN NOT NULL DEFAULT false,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "prescriptionNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "consultationId" TEXT,
    "notes" TEXT,
    "dispensingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "instructions" TEXT NOT NULL,
    "route" TEXT NOT NULL DEFAULT 'Oral',
    "dispensedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NursingStaff" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "isHeadNurse" BOOLEAN NOT NULL DEFAULT false,
    "shift" TEXT NOT NULL DEFAULT 'DAY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NursingStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NursingAssignment" (
    "id" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "assignedDate" DATE NOT NULL,
    "shift" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NursingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalsRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "admissionId" TEXT,
    "recordedByUserId" TEXT NOT NULL,
    "temperature" DECIMAL(5,2),
    "systolicBp" INTEGER,
    "diastolicBp" INTEGER,
    "pulseRate" INTEGER,
    "respiratoryRate" INTEGER,
    "oxygenSaturation" INTEGER,
    "bloodSugarMgDl" INTEGER,
    "weightKg" DECIMAL(5,2),
    "heightCm" DECIMAL(5,2),
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VitalsRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NursingTask" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "assignedNurseId" TEXT,
    "taskTitle" TEXT NOT NULL,
    "taskDescription" TEXT NOT NULL,
    "dueTime" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'ROUTINE',
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NursingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationAdministration" (
    "id" TEXT NOT NULL,
    "prescriptionItemId" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "administeredDose" TEXT NOT NULL,
    "administeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "MedicationAdministration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabTest" (
    "id" TEXT NOT NULL,
    "testCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sampleType" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "tatHours" INTEGER NOT NULL DEFAULT 24,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestParameter" (
    "id" TEXT NOT NULL,
    "labTestId" TEXT NOT NULL,
    "parameterName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "referenceLow" DECIMAL(8,2),
    "referenceHigh" DECIMAL(8,2),
    "criticalLow" DECIMAL(8,2),
    "criticalHigh" DECIMAL(8,2),
    "normalRangeStr" TEXT,

    CONSTRAINT "TestParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ORDERED',
    "priority" TEXT NOT NULL DEFAULT 'ROUTINE',
    "barcode" TEXT NOT NULL,
    "sampleCollectedAt" TIMESTAMP(3),
    "reportReleasedAt" TIMESTAMP(3),
    "releasedByUserId" TEXT,
    "clinicalNotes" TEXT,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabOrderItem" (
    "id" TEXT NOT NULL,
    "labOrderId" TEXT NOT NULL,
    "labTestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "labOrderId" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "measuredValue" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "referenceRange" TEXT NOT NULL,
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "technicianNotes" TEXT,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "dosageForm" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineBatch" (
    "id" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" DATE NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchasePrice" DECIMAL(10,2) NOT NULL,
    "sellingPrice" DECIMAL(10,2) NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicineBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispensingRecord" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "dispensedQuantity" INTEGER NOT NULL,
    "pharmacistUserId" TEXT NOT NULL,
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "DispensingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyTest" (
    "id" TEXT NOT NULL,
    "testCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RadiologyTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'ROUTINE',
    "status" TEXT NOT NULL DEFAULT 'ORDERED',
    "clinicalIndication" TEXT NOT NULL,
    "findings" TEXT,
    "impression" TEXT,
    "criticalAlert" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "reportReleasedAt" TIMESTAMP(3),
    "releasedByUserId" TEXT,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiologyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "genderAllowed" TEXT NOT NULL DEFAULT 'ANY',
    "floorNumber" INTEGER NOT NULL DEFAULT 1,
    "totalBeds" INTEGER NOT NULL DEFAULT 0,
    "occupiedBeds" INTEGER NOT NULL DEFAULT 0,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bed" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "bedNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STANDARD',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "dailyRate" DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    "currentPatientId" TEXT,
    "currentPatientName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admission" (
    "id" TEXT NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "admittingDoctorId" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ADMITTED',
    "admissionReason" TEXT NOT NULL,
    "initialDiagnosis" TEXT NOT NULL,
    "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dischargedAt" TIMESTAMP(3),
    "dischargeSummary" TEXT,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "admissionId" TEXT,
    "appointmentId" TEXT,
    "subTotal" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "discountPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionReference" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'SUCCESS',
    "receivedByUserId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "notes" TEXT,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceClaim" (
    "id" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "preAuthCode" TEXT,
    "claimAmount" DECIMAL(12,2) NOT NULL,
    "approvedAmount" DECIMAL(12,2),
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "InsuranceClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ambulance" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ADVANCED_LIFE_SUPPORT',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "currentGpsLat" DECIMAL(10,6),
    "currentGpsLng" DECIMAL(10,6),
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ambulance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbulanceDriver" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isOnDuty" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbulanceDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbulanceTrip" (
    "id" TEXT NOT NULL,
    "tripCode" TEXT NOT NULL,
    "ambulanceId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "callerName" TEXT NOT NULL,
    "callerPhone" TEXT NOT NULL,
    "pickupLocation" TEXT NOT NULL,
    "destinationHospital" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'CRITICAL',
    "status" TEXT NOT NULL DEFAULT 'DISPATCHED',
    "patientConditionSummary" TEXT NOT NULL,
    "handoverNotes" TEXT,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arrivedSceneAt" TIMESTAMP(3),
    "arrivedHospitalAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbulanceTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "linkUrl" TEXT,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT,
    "userId" TEXT,
    "userEmail" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetChallenge" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "AccountAccessPurpose" NOT NULL DEFAULT 'RESET',
    "channel" TEXT NOT NULL,
    "destinationHash" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestIp" TEXT,

    CONSTRAINT "PasswordResetChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterDataSet" (
    "id" TEXT NOT NULL,
    "scope" "MasterDataScope" NOT NULL,
    "hospitalId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterDataSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterDataItem" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MasterDataItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "dispensingRecordId" TEXT,
    "reversesMovementId" TEXT,
    "movementType" "InventoryMovementType" NOT NULL,
    "quantityDelta" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExportJob" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "branchId" TEXT,
    "requestedById" TEXT NOT NULL,
    "reportKey" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filters" JSONB,
    "status" "ReportExportStatus" NOT NULL DEFAULT 'QUEUED',
    "storageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "failureCode" TEXT,

    CONSTRAINT "ReportExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_code_key" ON "Hospital"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_licenseNumber_key" ON "Hospital"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_hospitalId_code_key" ON "Branch"("hospitalId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_id_hospitalId_key" ON "Branch"("id", "hospitalId");

-- CreateIndex
CREATE INDEX "Department_hospitalId_branchId_idx" ON "Department"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_hospitalId_code_key" ON "Department"("hospitalId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_id_hospitalId_key" ON "Department"("id", "hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_hospitalId_branchId_idx" ON "User"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_hospitalId_key" ON "User"("id", "hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "HospitalRolePolicy_roleId_idx" ON "HospitalRolePolicy"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountAccessToken_digest_key" ON "AccountAccessToken"("digest");

-- CreateIndex
CREATE INDEX "AccountAccessToken_userId_purpose_idx" ON "AccountAccessToken"("userId", "purpose");

-- CreateIndex
CREATE INDEX "AccountAccessToken_issuedById_idx" ON "AccountAccessToken"("issuedById");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");

-- CreateIndex
CREATE INDEX "UserRole_hospitalId_branchId_departmentId_idx" ON "UserRole"("hospitalId", "branchId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_scopeKey_key" ON "UserRole"("userId", "roleId", "scopeKey");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_replacedById_key" ON "RefreshToken"("replacedById");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_revokedAt_expiresAt_idx" ON "RefreshToken"("userId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_familyId_revokedAt_idx" ON "RefreshToken"("familyId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_employeeCode_idx" ON "Employee"("employeeCode");

-- CreateIndex
CREATE INDEX "Employee_hospitalId_branchId_idx" ON "Employee"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_hospitalId_employeeCode_key" ON "Employee"("hospitalId", "employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_id_hospitalId_key" ON "Employee"("id", "hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_id_hospitalId_branchId_key" ON "Employee"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_hospitalId_key" ON "Employee"("userId", "hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_employeeId_key" ON "Doctor"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_licenseNumber_key" ON "Doctor"("licenseNumber");

-- CreateIndex
CREATE INDEX "Doctor_departmentId_idx" ON "Doctor"("departmentId");

-- CreateIndex
CREATE INDEX "Doctor_designation_idx" ON "Doctor"("designation");

-- CreateIndex
CREATE INDEX "Doctor_hospitalId_branchId_idx" ON "Doctor"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_id_hospitalId_branchId_key" ON "Doctor"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_employeeId_hospitalId_branchId_key" ON "Doctor"("employeeId", "hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "DoctorQualification_doctorId_idx" ON "DoctorQualification"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorSchedule_doctorId_idx" ON "DoctorSchedule"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorLeave_doctorId_idx" ON "DoctorLeave"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_uhid_key" ON "Patient"("uhid");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_userId_key" ON "Patient"("userId");

-- CreateIndex
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");

-- CreateIndex
CREATE INDEX "Patient_hospitalId_idx" ON "Patient"("hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_id_hospitalId_key" ON "Patient"("id", "hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_userId_hospitalId_key" ON "Patient"("userId", "hospitalId");

-- CreateIndex
CREATE INDEX "PatientDocument_patientId_idx" ON "PatientDocument"("patientId");

-- CreateIndex
CREATE INDEX "PatientDocument_hospitalId_branchId_idx" ON "PatientDocument"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_appointmentNumber_key" ON "Appointment"("appointmentNumber");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_appointmentDate_idx" ON "Appointment"("doctorId", "appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_hospitalId_branchId_idx" ON "Appointment"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_branchId_doctorId_appointmentDate_tokenNumber_key" ON "Appointment"("branchId", "doctorId", "appointmentDate", "tokenNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_id_hospitalId_branchId_key" ON "Appointment"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_appointmentId_key" ON "Consultation"("appointmentId");

-- CreateIndex
CREATE INDEX "Consultation_patientId_idx" ON "Consultation"("patientId");

-- CreateIndex
CREATE INDEX "Consultation_doctorId_idx" ON "Consultation"("doctorId");

-- CreateIndex
CREATE INDEX "Consultation_hospitalId_branchId_idx" ON "Consultation"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_id_hospitalId_branchId_key" ON "Consultation"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_prescriptionNumber_key" ON "Prescription"("prescriptionNumber");

-- CreateIndex
CREATE INDEX "Prescription_patientId_idx" ON "Prescription"("patientId");

-- CreateIndex
CREATE INDEX "Prescription_doctorId_idx" ON "Prescription"("doctorId");

-- CreateIndex
CREATE INDEX "Prescription_hospitalId_branchId_idx" ON "Prescription"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_id_hospitalId_branchId_key" ON "Prescription"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");

-- CreateIndex
CREATE INDEX "PrescriptionItem_medicineId_idx" ON "PrescriptionItem"("medicineId");

-- CreateIndex
CREATE INDEX "PrescriptionItem_hospitalId_branchId_idx" ON "PrescriptionItem"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionItem_id_hospitalId_branchId_key" ON "PrescriptionItem"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "NursingStaff_employeeId_key" ON "NursingStaff"("employeeId");

-- CreateIndex
CREATE INDEX "NursingStaff_hospitalId_branchId_idx" ON "NursingStaff"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "NursingStaff_id_hospitalId_branchId_key" ON "NursingStaff"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "NursingStaff_employeeId_hospitalId_branchId_key" ON "NursingStaff"("employeeId", "hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "NursingAssignment_nurseId_idx" ON "NursingAssignment"("nurseId");

-- CreateIndex
CREATE INDEX "NursingAssignment_wardId_idx" ON "NursingAssignment"("wardId");

-- CreateIndex
CREATE INDEX "NursingAssignment_hospitalId_branchId_idx" ON "NursingAssignment"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "NursingAssignment_id_hospitalId_branchId_key" ON "NursingAssignment"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "VitalsRecord_patientId_idx" ON "VitalsRecord"("patientId");

-- CreateIndex
CREATE INDEX "VitalsRecord_admissionId_idx" ON "VitalsRecord"("admissionId");

-- CreateIndex
CREATE INDEX "VitalsRecord_hospitalId_branchId_idx" ON "VitalsRecord"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "VitalsRecord_id_hospitalId_branchId_key" ON "VitalsRecord"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "NursingTask_patientId_idx" ON "NursingTask"("patientId");

-- CreateIndex
CREATE INDEX "NursingTask_admissionId_idx" ON "NursingTask"("admissionId");

-- CreateIndex
CREATE INDEX "NursingTask_hospitalId_branchId_idx" ON "NursingTask"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "NursingTask_id_hospitalId_branchId_key" ON "NursingTask"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "MedicationAdministration_prescriptionItemId_idx" ON "MedicationAdministration"("prescriptionItemId");

-- CreateIndex
CREATE INDEX "MedicationAdministration_admissionId_idx" ON "MedicationAdministration"("admissionId");

-- CreateIndex
CREATE INDEX "MedicationAdministration_hospitalId_branchId_idx" ON "MedicationAdministration"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicationAdministration_id_hospitalId_branchId_key" ON "MedicationAdministration"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "LabTest_testCode_key" ON "LabTest"("testCode");

-- CreateIndex
CREATE INDEX "TestParameter_labTestId_idx" ON "TestParameter"("labTestId");

-- CreateIndex
CREATE UNIQUE INDEX "LabOrder_orderNumber_key" ON "LabOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LabOrder_barcode_key" ON "LabOrder"("barcode");

-- CreateIndex
CREATE INDEX "LabOrder_patientId_idx" ON "LabOrder"("patientId");

-- CreateIndex
CREATE INDEX "LabOrder_hospitalId_branchId_idx" ON "LabOrder"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "LabOrder_id_hospitalId_branchId_key" ON "LabOrder"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "LabOrderItem_labOrderId_idx" ON "LabOrderItem"("labOrderId");

-- CreateIndex
CREATE INDEX "LabOrderItem_labTestId_idx" ON "LabOrderItem"("labTestId");

-- CreateIndex
CREATE INDEX "LabResult_labOrderId_idx" ON "LabResult"("labOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Medicine_code_key" ON "Medicine"("code");

-- CreateIndex
CREATE INDEX "Medicine_brandName_idx" ON "Medicine"("brandName");

-- CreateIndex
CREATE INDEX "Medicine_genericName_idx" ON "Medicine"("genericName");

-- CreateIndex
CREATE INDEX "MedicineBatch_medicineId_idx" ON "MedicineBatch"("medicineId");

-- CreateIndex
CREATE INDEX "MedicineBatch_expiryDate_idx" ON "MedicineBatch"("expiryDate");

-- CreateIndex
CREATE INDEX "MedicineBatch_hospitalId_branchId_idx" ON "MedicineBatch"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineBatch_branchId_medicineId_batchNumber_key" ON "MedicineBatch"("branchId", "medicineId", "batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineBatch_id_hospitalId_branchId_key" ON "MedicineBatch"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "DispensingRecord_prescriptionId_idx" ON "DispensingRecord"("prescriptionId");

-- CreateIndex
CREATE INDEX "DispensingRecord_batchId_idx" ON "DispensingRecord"("batchId");

-- CreateIndex
CREATE INDEX "DispensingRecord_hospitalId_branchId_idx" ON "DispensingRecord"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "DispensingRecord_id_hospitalId_branchId_key" ON "DispensingRecord"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "RadiologyTest_testCode_key" ON "RadiologyTest"("testCode");

-- CreateIndex
CREATE UNIQUE INDEX "RadiologyOrder_orderNumber_key" ON "RadiologyOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "RadiologyOrder_patientId_idx" ON "RadiologyOrder"("patientId");

-- CreateIndex
CREATE INDEX "RadiologyOrder_hospitalId_branchId_idx" ON "RadiologyOrder"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "RadiologyOrder_id_hospitalId_branchId_key" ON "RadiologyOrder"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "Ward_hospitalId_branchId_idx" ON "Ward"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Ward_hospitalId_code_key" ON "Ward"("hospitalId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Ward_id_hospitalId_branchId_key" ON "Ward"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "Bed_wardId_idx" ON "Bed"("wardId");

-- CreateIndex
CREATE INDEX "Bed_status_idx" ON "Bed"("status");

-- CreateIndex
CREATE INDEX "Bed_hospitalId_branchId_idx" ON "Bed"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Bed_wardId_roomNumber_bedNumber_key" ON "Bed"("wardId", "roomNumber", "bedNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Bed_id_hospitalId_branchId_key" ON "Bed"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Bed_id_wardId_hospitalId_branchId_key" ON "Bed"("id", "wardId", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Admission_admissionNumber_key" ON "Admission"("admissionNumber");

-- CreateIndex
CREATE INDEX "Admission_patientId_idx" ON "Admission"("patientId");

-- CreateIndex
CREATE INDEX "Admission_bedId_idx" ON "Admission"("bedId");

-- CreateIndex
CREATE INDEX "Admission_hospitalId_branchId_idx" ON "Admission"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Admission_id_hospitalId_branchId_key" ON "Admission"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_patientId_idx" ON "Invoice"("patientId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_hospitalId_branchId_idx" ON "Invoice"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_id_hospitalId_branchId_key" ON "Invoice"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_hospitalId_branchId_idx" ON "Payment"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceClaim_claimNumber_key" ON "InsuranceClaim"("claimNumber");

-- CreateIndex
CREATE INDEX "InsuranceClaim_invoiceId_idx" ON "InsuranceClaim"("invoiceId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_patientId_idx" ON "InsuranceClaim"("patientId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_hospitalId_branchId_idx" ON "InsuranceClaim"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Ambulance_vehicleNumber_key" ON "Ambulance"("vehicleNumber");

-- CreateIndex
CREATE INDEX "Ambulance_hospitalId_branchId_idx" ON "Ambulance"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Ambulance_id_hospitalId_branchId_key" ON "Ambulance"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "AmbulanceDriver_employeeId_key" ON "AmbulanceDriver"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "AmbulanceDriver_licenseNumber_key" ON "AmbulanceDriver"("licenseNumber");

-- CreateIndex
CREATE INDEX "AmbulanceDriver_hospitalId_branchId_idx" ON "AmbulanceDriver"("hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "AmbulanceDriver_id_hospitalId_branchId_key" ON "AmbulanceDriver"("id", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "AmbulanceDriver_employeeId_hospitalId_branchId_key" ON "AmbulanceDriver"("employeeId", "hospitalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "AmbulanceTrip_tripCode_key" ON "AmbulanceTrip"("tripCode");

-- CreateIndex
CREATE INDEX "AmbulanceTrip_ambulanceId_idx" ON "AmbulanceTrip"("ambulanceId");

-- CreateIndex
CREATE INDEX "AmbulanceTrip_driverId_idx" ON "AmbulanceTrip"("driverId");

-- CreateIndex
CREATE INDEX "AmbulanceTrip_hospitalId_branchId_idx" ON "AmbulanceTrip"("hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_hospitalId_branchId_idx" ON "Notification"("hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_hospitalId_branchId_idx" ON "AuditLog"("hospitalId", "branchId");

-- CreateIndex
CREATE INDEX "PasswordResetChallenge_hospitalId_userId_purpose_expiresAt_idx" ON "PasswordResetChallenge"("hospitalId", "userId", "purpose", "expiresAt");

-- CreateIndex
CREATE INDEX "PasswordResetChallenge_expiresAt_consumedAt_idx" ON "PasswordResetChallenge"("expiresAt", "consumedAt");

-- CreateIndex
CREATE INDEX "MasterDataSet_scope_hospitalId_idx" ON "MasterDataSet"("scope", "hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "MasterDataSet_scope_key_key" ON "MasterDataSet"("scope", "key");

-- CreateIndex
CREATE INDEX "MasterDataItem_setId_status_sortOrder_idx" ON "MasterDataItem"("setId", "status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MasterDataItem_setId_code_key" ON "MasterDataItem"("setId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_dispensingRecordId_key" ON "InventoryMovement"("dispensingRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_reversesMovementId_key" ON "InventoryMovement"("reversesMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_idempotencyKey_key" ON "InventoryMovement"("idempotencyKey");

-- CreateIndex
CREATE INDEX "InventoryMovement_hospitalId_branchId_medicineId_createdAt_idx" ON "InventoryMovement"("hospitalId", "branchId", "medicineId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_batchId_createdAt_idx" ON "InventoryMovement"("batchId", "createdAt");

-- CreateIndex
CREATE INDEX "ReportExportJob_hospitalId_branchId_status_createdAt_idx" ON "ReportExportJob"("hospitalId", "branchId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ReportExportJob_requestedById_createdAt_idx" ON "ReportExportJob"("requestedById", "createdAt");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalRolePolicy" ADD CONSTRAINT "HospitalRolePolicy_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalRolePolicy" ADD CONSTRAINT "HospitalRolePolicy_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountAccessToken" ADD CONSTRAINT "AccountAccessToken_userId_hospitalId_fkey" FOREIGN KEY ("userId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountAccessToken" ADD CONSTRAINT "AccountAccessToken_issuedById_hospitalId_fkey" FOREIGN KEY ("issuedById", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_hospitalId_fkey" FOREIGN KEY ("userId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_departmentId_hospitalId_fkey" FOREIGN KEY ("departmentId", "hospitalId") REFERENCES "Department"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_hospitalId_fkey" FOREIGN KEY ("userId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "RefreshToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_hospitalId_fkey" FOREIGN KEY ("userId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_hospitalId_fkey" FOREIGN KEY ("departmentId", "hospitalId") REFERENCES "Department"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_employeeId_hospitalId_branchId_fkey" FOREIGN KEY ("employeeId", "hospitalId", "branchId") REFERENCES "Employee"("id", "hospitalId", "branchId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_departmentId_hospitalId_fkey" FOREIGN KEY ("departmentId", "hospitalId") REFERENCES "Department"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorQualification" ADD CONSTRAINT "DoctorQualification_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorLeave" ADD CONSTRAINT "DoctorLeave_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_hospitalId_fkey" FOREIGN KEY ("userId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_registrationBranchId_hospitalId_fkey" FOREIGN KEY ("registrationBranchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDocument" ADD CONSTRAINT "PatientDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDocument" ADD CONSTRAINT "PatientDocument_uploadedBy_hospitalId_fkey" FOREIGN KEY ("uploadedBy", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDocument" ADD CONSTRAINT "PatientDocument_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingStaff" ADD CONSTRAINT "NursingStaff_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingStaff" ADD CONSTRAINT "NursingStaff_employeeId_hospitalId_branchId_fkey" FOREIGN KEY ("employeeId", "hospitalId", "branchId") REFERENCES "Employee"("id", "hospitalId", "branchId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingAssignment" ADD CONSTRAINT "NursingAssignment_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NursingStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingAssignment" ADD CONSTRAINT "NursingAssignment_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingAssignment" ADD CONSTRAINT "NursingAssignment_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalsRecord" ADD CONSTRAINT "VitalsRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalsRecord" ADD CONSTRAINT "VitalsRecord_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalsRecord" ADD CONSTRAINT "VitalsRecord_recordedByUserId_hospitalId_fkey" FOREIGN KEY ("recordedByUserId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalsRecord" ADD CONSTRAINT "VitalsRecord_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingTask" ADD CONSTRAINT "NursingTask_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingTask" ADD CONSTRAINT "NursingTask_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingTask" ADD CONSTRAINT "NursingTask_assignedNurseId_fkey" FOREIGN KEY ("assignedNurseId") REFERENCES "NursingStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingTask" ADD CONSTRAINT "NursingTask_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_prescriptionItemId_fkey" FOREIGN KEY ("prescriptionItemId") REFERENCES "PrescriptionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NursingStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestParameter" ADD CONSTRAINT "TestParameter_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "LabTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_releasedByUserId_hospitalId_fkey" FOREIGN KEY ("releasedByUserId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrderItem" ADD CONSTRAINT "LabOrderItem_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "LabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrderItem" ADD CONSTRAINT "LabOrderItem_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "LabTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "LabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "TestParameter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineBatch" ADD CONSTRAINT "MedicineBatch_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineBatch" ADD CONSTRAINT "MedicineBatch_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingRecord" ADD CONSTRAINT "DispensingRecord_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingRecord" ADD CONSTRAINT "DispensingRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MedicineBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingRecord" ADD CONSTRAINT "DispensingRecord_pharmacistUserId_hospitalId_fkey" FOREIGN KEY ("pharmacistUserId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingRecord" ADD CONSTRAINT "DispensingRecord_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyOrder" ADD CONSTRAINT "RadiologyOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyOrder" ADD CONSTRAINT "RadiologyOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyOrder" ADD CONSTRAINT "RadiologyOrder_testId_fkey" FOREIGN KEY ("testId") REFERENCES "RadiologyTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyOrder" ADD CONSTRAINT "RadiologyOrder_releasedByUserId_hospitalId_fkey" FOREIGN KEY ("releasedByUserId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyOrder" ADD CONSTRAINT "RadiologyOrder_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_admittingDoctorId_fkey" FOREIGN KEY ("admittingDoctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_receivedByUserId_hospitalId_fkey" FOREIGN KEY ("receivedByUserId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ambulance" ADD CONSTRAINT "Ambulance_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ambulance" ADD CONSTRAINT "Ambulance_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbulanceDriver" ADD CONSTRAINT "AmbulanceDriver_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbulanceDriver" ADD CONSTRAINT "AmbulanceDriver_employeeId_hospitalId_branchId_fkey" FOREIGN KEY ("employeeId", "hospitalId", "branchId") REFERENCES "Employee"("id", "hospitalId", "branchId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbulanceTrip" ADD CONSTRAINT "AmbulanceTrip_ambulanceId_fkey" FOREIGN KEY ("ambulanceId") REFERENCES "Ambulance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbulanceTrip" ADD CONSTRAINT "AmbulanceTrip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "AmbulanceDriver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbulanceTrip" ADD CONSTRAINT "AmbulanceTrip_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_hospitalId_fkey" FOREIGN KEY ("userId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_hospitalId_fkey" FOREIGN KEY ("userId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetChallenge" ADD CONSTRAINT "PasswordResetChallenge_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetChallenge" ADD CONSTRAINT "PasswordResetChallenge_userId_hospitalId_fkey" FOREIGN KEY ("userId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterDataSet" ADD CONSTRAINT "MasterDataSet_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterDataItem" ADD CONSTRAINT "MasterDataItem_setId_fkey" FOREIGN KEY ("setId") REFERENCES "MasterDataSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MedicineBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_dispensingRecordId_fkey" FOREIGN KEY ("dispensingRecordId") REFERENCES "DispensingRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_reversesMovementId_fkey" FOREIGN KEY ("reversesMovementId") REFERENCES "InventoryMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_performedByUserId_hospitalId_fkey" FOREIGN KEY ("performedByUserId", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExportJob" ADD CONSTRAINT "ReportExportJob_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExportJob" ADD CONSTRAINT "ReportExportJob_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExportJob" ADD CONSTRAINT "ReportExportJob_requestedById_hospitalId_fkey" FOREIGN KEY ("requestedById", "hospitalId") REFERENCES "User"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ============================================================================
-- SUPERSEDED REVIEW-ONLY FROM-EMPTY BASELINE. Do not deploy this file.
-- It predates approval that Hospital.id and hospitalId references use native
-- PostgreSQL UUID and that Hospital.code is UYIRINAI. The approved path keeps
-- the existing init migration and uses a second forward migration instead.
-- The custom enforcement ideas below are being adapted into that forward draft.
-- Generated base above: Prisma CLI 6.19.3, from an empty datamodel to
-- docs/uyirinai-proposed-schema.prisma before the native UUID approval. Reproduce with:
--   pnpm exec prisma migrate diff --from-empty --to-schema-datamodel docs/uyirinai-proposed-schema.prisma --script
-- This file is a draft. It has NOT been executed. Review every business guard,
-- and place the approved SQL in the first checked-in migration only after approval.
-- The repository already has prisma/migrations/20261119111627_init/migration.sql
-- (47 tables, no enum types). Do not run migrate deploy with that history plus
-- this baseline: the existing migration would create overlapping legacy tables.
-- A migration-history/reconciliation decision is required before deployment.
-- ============================================================================

-- Enforce at most one hospital row; its actual UUID is never embedded here.
-- Bootstrap must create the approved UYIRINAI row before branch/user records.
CREATE UNIQUE INDEX "Hospital_singleton_one_row"
  ON "Hospital" ((TRUE));

-- System sets are global; hospital sets belong to the single hospital and are
-- never marked as system-managed. The Hospital singleton index supplies tenant scope.
ALTER TABLE "MasterDataSet"
  ADD CONSTRAINT "MasterDataSet_scope_consistency_check"
  CHECK (
    ("scope" = 'SYSTEM' AND "hospitalId" IS NULL AND "isSystem" = TRUE)
    OR
    ("scope" = 'HOSPITAL' AND "hospitalId" IS NOT NULL AND "isSystem" = FALSE)
  );

-- Active Admission rows are the bed occupancy authority. This prevents two
-- concurrent admissions from claiming the same bed; it does not synchronize
-- Bed.status or Ward.occupiedBeds (the approved application transaction does that).
CREATE UNIQUE INDEX "Admission_one_active_per_bed"
  ON "Admission" ("bedId") WHERE "status" = 'ADMITTED';

ALTER TABLE "MedicineBatch"
  ADD CONSTRAINT "MedicineBatch_quantity_nonnegative_check"
  CHECK ("quantity" >= 0);
ALTER TABLE "Ward"
  ADD CONSTRAINT "Ward_bed_counts_nonnegative_check"
  CHECK ("totalBeds" >= 0 AND "occupiedBeds" >= 0);
ALTER TABLE "Ward"
  ADD CONSTRAINT "Ward_occupied_not_over_capacity_check"
  CHECK ("occupiedBeds" <= "totalBeds");

-- At most one cutover opening snapshot is recorded for each batch.
CREATE UNIQUE INDEX "InventoryMovement_one_opening_balance_per_batch"
  ON "InventoryMovement" ("batchId") WHERE "movementType" = 'OPENING_BALANCE';

-- Role name and scope are cross-row rules and cannot be expressed by Prisma or a
-- plain CHECK. Patient null scope is self-only through User.patient; it is not a
-- hospital-wide staff grant. Other ordinary staff need a branch.
CREATE FUNCTION "uyirinai_check_user_role_scope"() RETURNS trigger
LANGUAGE plpgsql AS $uyirinai$
DECLARE v_role text; v_department_branch text; v_department_hospital text;
BEGIN
  SELECT "name" INTO v_role FROM "Role" WHERE "id" = NEW."roleId";
  IF v_role IS NULL THEN RAISE EXCEPTION 'Unknown role for UserRole'; END IF;

  IF v_role IN ('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PATIENT') THEN
    IF NEW."branchId" IS NOT NULL OR NEW."departmentId" IS NOT NULL THEN
      RAISE EXCEPTION 'This role requires null branch and department scope';
    END IF;
  ELSIF v_role = 'DEPARTMENT_ADMIN' THEN
    IF NEW."branchId" IS NULL OR NEW."departmentId" IS NULL THEN
      RAISE EXCEPTION 'Department Admin requires both branch and department scope';
    END IF;
  ELSIF NEW."branchId" IS NULL THEN
    RAISE EXCEPTION 'Operational role requires a branch scope';
  END IF;

  IF NEW."departmentId" IS NOT NULL THEN
    SELECT "branchId", "hospitalId" INTO v_department_branch, v_department_hospital
      FROM "Department" WHERE "id" = NEW."departmentId";
    IF NOT FOUND OR v_department_hospital IS DISTINCT FROM NEW."hospitalId" THEN
      RAISE EXCEPTION 'UserRole department belongs to another hospital';
    END IF;
    IF v_role = 'DEPARTMENT_ADMIN' AND v_department_branch IS NOT NULL
       AND v_department_branch IS DISTINCT FROM NEW."branchId" THEN
      RAISE EXCEPTION 'Department Admin department must be global or in its assigned branch';
    ELSIF v_role NOT IN ('SUPER_ADMIN','HOSPITAL_ADMIN','PATIENT')
       AND v_department_branch IS NOT NULL
       AND v_department_branch IS DISTINCT FROM NEW."branchId" THEN
      RAISE EXCEPTION 'Department scope must be global or match the assigned branch';
    END IF;
  END IF;
  RETURN NEW;
END;
$uyirinai$;
CREATE TRIGGER "UserRole_scope_guard"
  BEFORE INSERT OR UPDATE OF "hospitalId", "roleId", "branchId", "departmentId"
  ON "UserRole" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_user_role_scope"();

-- These partial unique indexes prevent duplicate role assignments per actual
-- scope even if a client supplies different scopeKey strings. The original
-- Prisma unique index is retained for compatibility and query support.
CREATE UNIQUE INDEX "UserRole_unique_hospital_scope"
  ON "UserRole" ("userId", "roleId")
  WHERE "branchId" IS NULL AND "departmentId" IS NULL;
CREATE UNIQUE INDEX "UserRole_unique_branch_scope"
  ON "UserRole" ("userId", "roleId", "branchId")
  WHERE "branchId" IS NOT NULL AND "departmentId" IS NULL;
CREATE UNIQUE INDEX "UserRole_unique_department_scope"
  ON "UserRole" ("userId", "roleId", "branchId", "departmentId")
  WHERE "branchId" IS NOT NULL AND "departmentId" IS NOT NULL;

-- This trigger validates selected cross-row branch and department relationships.
-- Direct (branchId,hospitalId)->Branch composite FKs are already in the Prisma
-- baseline. These extra checks stop a valid branch row being combined with a
-- doctor, department, admission, invoice, or other parent from a different branch.
CREATE FUNCTION "uyirinai_assert_patient_hospital"(p_id text, p_hospital text)
RETURNS void LANGUAGE plpgsql AS $uyirinai$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Patient" WHERE "id"=p_id AND "hospitalId"=p_hospital) THEN
    RAISE EXCEPTION 'Patient is outside the record hospital';
  END IF;
END;
$uyirinai$;
CREATE FUNCTION "uyirinai_assert_doctor_branch"(p_id text, p_hospital text, p_branch text)
RETURNS void LANGUAGE plpgsql AS $uyirinai$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Doctor" WHERE "id"=p_id AND "hospitalId"=p_hospital AND "branchId"=p_branch) THEN
    RAISE EXCEPTION 'Doctor is outside the record hospital or branch';
  END IF;
END;
$uyirinai$;
CREATE FUNCTION "uyirinai_assert_department_branch"(p_id text, p_hospital text, p_branch text)
RETURNS void LANGUAGE plpgsql AS $uyirinai$
DECLARE v_branch text;
BEGIN
  SELECT "branchId" INTO v_branch FROM "Department" WHERE "id"=p_id AND "hospitalId"=p_hospital;
  IF NOT FOUND OR (v_branch IS NOT NULL AND v_branch IS DISTINCT FROM p_branch) THEN
    RAISE EXCEPTION 'Department is outside the record hospital or branch';
  END IF;
END;
$uyirinai$;
CREATE FUNCTION "uyirinai_assert_user_hospital"(p_id text, p_hospital text)
RETURNS void LANGUAGE plpgsql AS $uyirinai$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "User" WHERE "id"=p_id AND "hospitalId"=p_hospital) THEN
    RAISE EXCEPTION 'User is outside the record hospital';
  END IF;
END;
$uyirinai$;

CREATE FUNCTION "uyirinai_check_related_scope"() RETURNS trigger
LANGUAGE plpgsql AS $uyirinai$
DECLARE v record;
BEGIN
  CASE TG_TABLE_NAME
  WHEN 'Doctor' THEN
    PERFORM "uyirinai_assert_department_branch"(NEW."departmentId", NEW."hospitalId", NEW."branchId");
  WHEN 'Employee' THEN
    IF NEW."departmentId" IS NOT NULL THEN
      IF NEW."branchId" IS NULL THEN
        IF EXISTS (SELECT 1 FROM "Department" WHERE "id"=NEW."departmentId" AND "hospitalId"=NEW."hospitalId" AND "branchId" IS NOT NULL) THEN
          RAISE EXCEPTION 'Hospital-based employee cannot reference a branch-only department';
        END IF;
      ELSE
        PERFORM "uyirinai_assert_department_branch"(NEW."departmentId", NEW."hospitalId", NEW."branchId");
      END IF;
    END IF;
  WHEN 'Appointment' THEN
    PERFORM "uyirinai_assert_patient_hospital"(NEW."patientId", NEW."hospitalId");
    PERFORM "uyirinai_assert_doctor_branch"(NEW."doctorId", NEW."hospitalId", NEW."branchId");
    PERFORM "uyirinai_assert_department_branch"(NEW."departmentId", NEW."hospitalId", NEW."branchId");
  WHEN 'Consultation' THEN
    PERFORM "uyirinai_assert_patient_hospital"(NEW."patientId", NEW."hospitalId");
    PERFORM "uyirinai_assert_doctor_branch"(NEW."doctorId", NEW."hospitalId", NEW."branchId");
    SELECT * INTO v FROM "Appointment" WHERE "id"=NEW."appointmentId";
    IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" OR v."patientId" IS DISTINCT FROM NEW."patientId" OR v."doctorId" IS DISTINCT FROM NEW."doctorId" THEN
      RAISE EXCEPTION 'Consultation must match its appointment, patient, doctor, hospital, and branch';
    END IF;
  WHEN 'Prescription' THEN
    PERFORM "uyirinai_assert_patient_hospital"(NEW."patientId", NEW."hospitalId");
    PERFORM "uyirinai_assert_doctor_branch"(NEW."doctorId", NEW."hospitalId", NEW."branchId");
    IF NEW."consultationId" IS NOT NULL THEN
      SELECT * INTO v FROM "Consultation" WHERE "id"=NEW."consultationId";
      IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" OR v."patientId" IS DISTINCT FROM NEW."patientId" OR v."doctorId" IS DISTINCT FROM NEW."doctorId" THEN
        RAISE EXCEPTION 'Prescription must match its consultation, patient, doctor, hospital, and branch';
      END IF;
    END IF;
  WHEN 'PrescriptionItem' THEN
    SELECT * INTO v FROM "Prescription" WHERE "id"=NEW."prescriptionId";
    IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" THEN
      RAISE EXCEPTION 'Prescription item must match its prescription hospital and branch';
    END IF;
  WHEN 'NursingAssignment' THEN
    SELECT ns."hospitalId" AS nurse_hospital, ns."branchId" AS nurse_branch, w."hospitalId" AS ward_hospital, w."branchId" AS ward_branch
      INTO v FROM "NursingStaff" ns CROSS JOIN "Ward" w WHERE ns."id"=NEW."nurseId" AND w."id"=NEW."wardId";
    IF NOT FOUND OR v.nurse_hospital IS DISTINCT FROM NEW."hospitalId" OR v.nurse_branch IS DISTINCT FROM NEW."branchId" OR v.ward_hospital IS DISTINCT FROM NEW."hospitalId" OR v.ward_branch IS DISTINCT FROM NEW."branchId" THEN
      RAISE EXCEPTION 'Nursing assignment nurse and ward must match its hospital and branch';
    END IF;
  WHEN 'VitalsRecord' THEN
    PERFORM "uyirinai_assert_patient_hospital"(NEW."patientId", NEW."hospitalId");
    PERFORM "uyirinai_assert_user_hospital"(NEW."recordedByUserId", NEW."hospitalId");
    IF NEW."admissionId" IS NOT NULL THEN
      SELECT * INTO v FROM "Admission" WHERE "id"=NEW."admissionId";
      IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" OR v."patientId" IS DISTINCT FROM NEW."patientId" THEN
        RAISE EXCEPTION 'Vitals admission must match patient, hospital, and branch';
      END IF;
    END IF;
  WHEN 'NursingTask' THEN
    PERFORM "uyirinai_assert_patient_hospital"(NEW."patientId", NEW."hospitalId");
    SELECT * INTO v FROM "Admission" WHERE "id"=NEW."admissionId";
    IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" OR v."patientId" IS DISTINCT FROM NEW."patientId" THEN
      RAISE EXCEPTION 'Nursing task admission must match patient, hospital, and branch';
    END IF;
    IF NEW."assignedNurseId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "NursingStaff" WHERE "id"=NEW."assignedNurseId" AND "hospitalId"=NEW."hospitalId" AND "branchId"=NEW."branchId") THEN
      RAISE EXCEPTION 'Assigned nurse is outside the task hospital or branch';
    END IF;
  WHEN 'MedicationAdministration' THEN
    SELECT * INTO v FROM "Admission" WHERE "id"=NEW."admissionId";
    IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" THEN
      RAISE EXCEPTION 'Medication admission is outside the administration hospital or branch';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "NursingStaff" WHERE "id"=NEW."nurseId" AND "hospitalId"=NEW."hospitalId" AND "branchId"=NEW."branchId") THEN
      RAISE EXCEPTION 'Administering nurse is outside the administration hospital or branch';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "PrescriptionItem" WHERE "id"=NEW."prescriptionItemId" AND "hospitalId"=NEW."hospitalId" AND "branchId"=NEW."branchId") THEN
      RAISE EXCEPTION 'Prescription item is outside the administration hospital or branch';
    END IF;
  WHEN 'LabOrder' THEN
    PERFORM "uyirinai_assert_patient_hospital"(NEW."patientId", NEW."hospitalId");
    PERFORM "uyirinai_assert_doctor_branch"(NEW."doctorId", NEW."hospitalId", NEW."branchId");
    IF NEW."releasedByUserId" IS NOT NULL THEN PERFORM "uyirinai_assert_user_hospital"(NEW."releasedByUserId", NEW."hospitalId"); END IF;
  WHEN 'LabOrderItem' THEN
    IF NOT EXISTS (SELECT 1 FROM "LabOrder" WHERE "id"=NEW."labOrderId") THEN
      RAISE EXCEPTION 'Lab order item parent does not exist';
    END IF;
  WHEN 'LabResult' THEN
    IF NOT EXISTS (
      SELECT 1 FROM "LabOrderItem" oi
      JOIN "TestParameter" tp ON tp."labTestId"=oi."labTestId"
      WHERE oi."labOrderId"=NEW."labOrderId" AND tp."id"=NEW."parameterId"
    ) THEN
      RAISE EXCEPTION 'Lab result parameter must belong to a test ordered for this lab order';
    END IF;
  WHEN 'RadiologyOrder' THEN
    PERFORM "uyirinai_assert_patient_hospital"(NEW."patientId", NEW."hospitalId");
    PERFORM "uyirinai_assert_doctor_branch"(NEW."doctorId", NEW."hospitalId", NEW."branchId");
    IF NEW."releasedByUserId" IS NOT NULL THEN PERFORM "uyirinai_assert_user_hospital"(NEW."releasedByUserId", NEW."hospitalId"); END IF;
  WHEN 'Ward' THEN
    IF NEW."departmentId" IS NOT NULL THEN PERFORM "uyirinai_assert_department_branch"(NEW."departmentId", NEW."hospitalId", NEW."branchId"); END IF;
  WHEN 'Bed' THEN
    SELECT * INTO v FROM "Ward" WHERE "id"=NEW."wardId";
    IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" THEN
      RAISE EXCEPTION 'Bed ward must match hospital and branch';
    END IF;
  WHEN 'Admission' THEN
    PERFORM "uyirinai_assert_patient_hospital"(NEW."patientId", NEW."hospitalId");
    PERFORM "uyirinai_assert_doctor_branch"(NEW."admittingDoctorId", NEW."hospitalId", NEW."branchId");
    SELECT * INTO v FROM "Ward" WHERE "id"=NEW."wardId";
    IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" THEN RAISE EXCEPTION 'Admission ward must match hospital and branch'; END IF;
    SELECT * INTO v FROM "Bed" WHERE "id"=NEW."bedId";
    IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" OR v."wardId" IS DISTINCT FROM NEW."wardId" THEN RAISE EXCEPTION 'Admission bed must match its ward, hospital, and branch'; END IF;
  WHEN 'Invoice' THEN
    PERFORM "uyirinai_assert_patient_hospital"(NEW."patientId", NEW."hospitalId");
    IF NEW."admissionId" IS NOT NULL THEN
      SELECT * INTO v FROM "Admission" WHERE "id"=NEW."admissionId";
      IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" OR v."patientId" IS DISTINCT FROM NEW."patientId" THEN RAISE EXCEPTION 'Invoice admission must match patient, hospital, and branch'; END IF;
    END IF;
    IF NEW."appointmentId" IS NOT NULL THEN
      SELECT * INTO v FROM "Appointment" WHERE "id"=NEW."appointmentId";
      IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" OR v."patientId" IS DISTINCT FROM NEW."patientId" THEN RAISE EXCEPTION 'Invoice appointment must match patient, hospital, and branch'; END IF;
    END IF;
  WHEN 'InvoiceItem' THEN
    SELECT * INTO v FROM "Invoice" WHERE "id"=NEW."invoiceId";
    IF NOT FOUND THEN RAISE EXCEPTION 'Invoice item requires an invoice'; END IF;
  WHEN 'Payment' THEN
    SELECT * INTO v FROM "Invoice" WHERE "id"=NEW."invoiceId";
    IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" THEN RAISE EXCEPTION 'Payment invoice must match hospital and branch'; END IF;
    PERFORM "uyirinai_assert_user_hospital"(NEW."receivedByUserId", NEW."hospitalId");
  WHEN 'InsuranceClaim' THEN
    SELECT * INTO v FROM "Invoice" WHERE "id"=NEW."invoiceId";
    IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" OR v."patientId" IS DISTINCT FROM NEW."patientId" THEN RAISE EXCEPTION 'Insurance claim must match invoice patient, hospital, and branch'; END IF;
  WHEN 'DispensingRecord' THEN
    SELECT * INTO v FROM "Prescription" WHERE "id"=NEW."prescriptionId";
    IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" THEN RAISE EXCEPTION 'Dispensing prescription must match hospital and branch'; END IF;
    SELECT * INTO v FROM "MedicineBatch" WHERE "id"=NEW."batchId";
    IF NOT FOUND OR v."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v."branchId" IS DISTINCT FROM NEW."branchId" THEN RAISE EXCEPTION 'Dispensing batch must match hospital and branch'; END IF;
    PERFORM "uyirinai_assert_user_hospital"(NEW."pharmacistUserId", NEW."hospitalId");
  WHEN 'AmbulanceTrip' THEN
    IF NOT EXISTS (SELECT 1 FROM "Ambulance" WHERE "id"=NEW."ambulanceId" AND "hospitalId"=NEW."hospitalId" AND "branchId"=NEW."branchId") OR NOT EXISTS (SELECT 1 FROM "AmbulanceDriver" WHERE "id"=NEW."driverId" AND "hospitalId"=NEW."hospitalId" AND "branchId"=NEW."branchId") THEN
      RAISE EXCEPTION 'Ambulance and driver must match trip hospital and branch';
    END IF;
  WHEN 'PatientDocument' THEN
    PERFORM "uyirinai_assert_patient_hospital"(NEW."patientId", NEW."hospitalId");
    PERFORM "uyirinai_assert_user_hospital"(NEW."uploadedBy", NEW."hospitalId");
  END CASE;
  RETURN NEW;
END;
$uyirinai$;

-- Attach only to rows with the listed relation fields. The trigger performs
-- consistency checks; it does not grant read/write permissions or maintain caches.
CREATE TRIGGER "Doctor_department_scope_guard" BEFORE INSERT OR UPDATE ON "Doctor" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "Employee_department_scope_guard" BEFORE INSERT OR UPDATE ON "Employee" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "Appointment_related_scope_guard" BEFORE INSERT OR UPDATE ON "Appointment" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "Consultation_related_scope_guard" BEFORE INSERT OR UPDATE ON "Consultation" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "Prescription_related_scope_guard" BEFORE INSERT OR UPDATE ON "Prescription" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "PrescriptionItem_related_scope_guard" BEFORE INSERT OR UPDATE ON "PrescriptionItem" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "NursingAssignment_related_scope_guard" BEFORE INSERT OR UPDATE ON "NursingAssignment" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "VitalsRecord_related_scope_guard" BEFORE INSERT OR UPDATE ON "VitalsRecord" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "NursingTask_related_scope_guard" BEFORE INSERT OR UPDATE ON "NursingTask" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "MedicationAdministration_related_scope_guard" BEFORE INSERT OR UPDATE ON "MedicationAdministration" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "LabOrder_related_scope_guard" BEFORE INSERT OR UPDATE ON "LabOrder" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "LabOrderItem_related_scope_guard" BEFORE INSERT OR UPDATE ON "LabOrderItem" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "LabResult_related_scope_guard" BEFORE INSERT OR UPDATE ON "LabResult" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "RadiologyOrder_related_scope_guard" BEFORE INSERT OR UPDATE ON "RadiologyOrder" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "Ward_department_scope_guard" BEFORE INSERT OR UPDATE ON "Ward" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "Bed_ward_scope_guard" BEFORE INSERT OR UPDATE ON "Bed" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "Admission_related_scope_guard" BEFORE INSERT OR UPDATE ON "Admission" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "Invoice_related_scope_guard" BEFORE INSERT OR UPDATE ON "Invoice" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "InvoiceItem_related_scope_guard" BEFORE INSERT OR UPDATE ON "InvoiceItem" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "Payment_related_scope_guard" BEFORE INSERT OR UPDATE ON "Payment" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "InsuranceClaim_related_scope_guard" BEFORE INSERT OR UPDATE ON "InsuranceClaim" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "DispensingRecord_related_scope_guard" BEFORE INSERT OR UPDATE ON "DispensingRecord" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "AmbulanceTrip_related_scope_guard" BEFORE INSERT OR UPDATE ON "AmbulanceTrip" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();
CREATE TRIGGER "PatientDocument_related_scope_guard" BEFORE INSERT OR UPDATE ON "PatientDocument" FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_related_scope"();

-- Inventory ledger rows are immutable and movement relationships/types are exact.
-- Expiry boundary is intentionally left to the pharmacy transaction until timezone
-- and end-of-expiry-day policy are approved.
CREATE FUNCTION "uyirinai_check_inventory_movement"() RETURNS trigger
LANGUAGE plpgsql AS $uyirinai$
DECLARE v_batch record; v_dispense record; v_original record; v_cutover timestamptz;
BEGIN
  IF TG_OP <> 'INSERT' THEN RAISE EXCEPTION 'Inventory movements are append-only'; END IF;
  SELECT * INTO v_batch FROM "MedicineBatch" WHERE "id"=NEW."batchId";
  IF NOT FOUND OR v_batch."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v_batch."branchId" IS DISTINCT FROM NEW."branchId" OR NEW."medicineId" IS DISTINCT FROM v_batch."medicineId" THEN
    RAISE EXCEPTION 'Movement batch, medicine, hospital, and branch must match';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "User" WHERE "id"=NEW."performedByUserId" AND "hospitalId"=NEW."hospitalId") THEN
    RAISE EXCEPTION 'Movement performer must belong to its hospital';
  END IF;
  IF NEW."movementType" = 'OPENING_BALANCE' THEN
    IF NEW."quantityDelta" <= 0 OR NEW."dispensingRecordId" IS NOT NULL OR NEW."reversesMovementId" IS NOT NULL THEN
      RAISE EXCEPTION 'Opening balance must be positive and unlinked';
    END IF;
    SELECT "inventoryLedgerCutoverAt" INTO v_cutover FROM "Hospital" WHERE "id"=NEW."hospitalId";
    IF v_cutover IS NULL OR NEW."createdAt" IS DISTINCT FROM v_cutover THEN
      RAISE EXCEPTION 'Opening balance must use the recorded hospital ledger cutover instant';
    END IF;
    IF NEW."quantityDelta" IS DISTINCT FROM v_batch."quantity" THEN
      RAISE EXCEPTION 'Opening balance must equal the batch quantity at cutover';
    END IF;
  ELSIF NEW."movementType" = 'DISPENSE' THEN
    IF NEW."quantityDelta" >= 0 OR NEW."dispensingRecordId" IS NULL OR NEW."reversesMovementId" IS NOT NULL THEN
      RAISE EXCEPTION 'Dispense movement must be negative, linked to one dispensing record, and not a reversal';
    END IF;
    SELECT * INTO v_dispense FROM "DispensingRecord" WHERE "id"=NEW."dispensingRecordId";
    IF NOT FOUND OR v_dispense."batchId" IS DISTINCT FROM NEW."batchId" OR v_dispense."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v_dispense."branchId" IS DISTINCT FROM NEW."branchId" OR -NEW."quantityDelta" IS DISTINCT FROM v_dispense."dispensedQuantity" THEN
      RAISE EXCEPTION 'Dispense movement must exactly match its dispensing record';
    END IF;
  ELSIF NEW."movementType" = 'DISPENSE_REVERSAL' THEN
    IF NEW."quantityDelta" <= 0 OR NEW."dispensingRecordId" IS NOT NULL OR NEW."reversesMovementId" IS NULL THEN
      RAISE EXCEPTION 'Dispense reversal must be positive and link only to its original movement';
    END IF;
    SELECT * INTO v_original FROM "InventoryMovement" WHERE "id"=NEW."reversesMovementId";
    IF NOT FOUND OR v_original."movementType" <> 'DISPENSE' OR v_original."reversesMovementId" IS NOT NULL OR v_original."batchId" IS DISTINCT FROM NEW."batchId" OR v_original."medicineId" IS DISTINCT FROM NEW."medicineId" OR v_original."hospitalId" IS DISTINCT FROM NEW."hospitalId" OR v_original."branchId" IS DISTINCT FROM NEW."branchId" OR NEW."quantityDelta" IS DISTINCT FROM -v_original."quantityDelta" THEN
      RAISE EXCEPTION 'Reversal must exactly negate one original dispense in the same batch, medicine, hospital, and branch';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unsupported inventory movement type';
  END IF;
  RETURN NEW;
END;
$uyirinai$;
CREATE TRIGGER "InventoryMovement_append_only_and_shape_guard"
  BEFORE INSERT OR UPDATE OR DELETE ON "InventoryMovement"
  FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_inventory_movement"();

-- Audit events are evidence and must not be edited or deleted through ordinary
-- application/database roles. This also means physical User deletion will fail
-- when its AuditLog actor link would need SET NULL; use account deactivation.
CREATE FUNCTION "uyirinai_reject_audit_mutation"() RETURNS trigger
LANGUAGE plpgsql AS $uyirinai$
BEGIN
  RAISE EXCEPTION 'AuditLog rows are append-only';
END;
$uyirinai$;
CREATE TRIGGER "AuditLog_append_only_guard"
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION "uyirinai_reject_audit_mutation"();

-- Cross-row updates to parent ownership can invalidate a previously valid child.
-- The final migration must either block ownership changes when dependent rows exist
-- or attach matching guards to parent updates; no application should reassign the
-- hospital/branch of a historical operational record. The service must also deny
-- changing Role.name after role assignments exist and changing Department.branchId,
-- Doctor.branchId, Ward/Bed location, or employee location when the change would
-- make existing assignments or history inconsistent. Parent-side guards are a
-- finalization item; the child-side trigger below cannot detect parent-only updates.

-- Application-only invariants (intentionally no database trigger):
-- * Admission/discharge transactions lock bed and ward, atomically update Admission,
--   Bed display fields and Ward.occupiedBeds; the partial unique index is a second guard.
-- * Dispense/reversal transactions lock batch, update MedicineBatch.quantity,
--   synchronize Medicine.currentStock, and insert the immutable movement atomically.
--   currentStock is a cache, never stock authority. Reconcile it against batch sums.
-- * Reject expired stock at dispense using the approved business-timezone boundary.
-- * Payment idempotency uses unique idempotencyKey and requestFingerprint; invoice lock,
--   payment insert, and balance transition happen atomically in application service.
-- * OTP consumption and refresh-token rotation use conditional single-row updates
--   and transactions; raw tokens/OTPs are never stored.
-- * Cross-branch patient access remains permission-gated and audit-logged by the API;
--   foreign keys and triggers establish data ownership, not read authorization.
