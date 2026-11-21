BEGIN;

-- CreateEnum
CREATE TYPE "AppointmentRequestStatus" AS ENUM ('PENDING', 'PATIENT_LINKED', 'BOOKED');

-- CreateTable
CREATE TABLE "AppointmentRequest" (
    "id" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "branchId" TEXT,
    "patientName" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(16) NOT NULL,
    "specialty" VARCHAR(80) NOT NULL,
    "preferredDate" DATE NOT NULL,
    "status" "AppointmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submissionKey" CHAR(64) NOT NULL,
    "patientId" TEXT,
    "appointmentId" TEXT,

    CONSTRAINT "AppointmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRequest_appointmentId_key" ON "AppointmentRequest"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentRequest_hospitalId_phone_submittedAt_idx" ON "AppointmentRequest"("hospitalId", "phone", "submittedAt");

-- CreateIndex
CREATE INDEX "AppointmentRequest_hospitalId_branchId_status_submittedAt_idx" ON "AppointmentRequest"("hospitalId", "branchId", "status", "submittedAt");

-- CreateIndex
CREATE INDEX "AppointmentRequest_patientId_hospitalId_idx" ON "AppointmentRequest"("patientId", "hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRequest_hospitalId_submissionKey_key" ON "AppointmentRequest"("hospitalId", "submissionKey");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_id_hospitalId_branchId_patientId_key" ON "Appointment"("id", "hospitalId", "branchId", "patientId");

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_branchId_hospitalId_fkey" FOREIGN KEY ("branchId", "hospitalId") REFERENCES "Branch"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_patientId_hospitalId_fkey" FOREIGN KEY ("patientId", "hospitalId") REFERENCES "Patient"("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_appointmentId_hospitalId_branchId_patie_fkey" FOREIGN KEY ("appointmentId", "hospitalId", "branchId", "patientId") REFERENCES "Appointment"("id", "hospitalId", "branchId", "patientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Booking must reference the same verified patient and routed branch.
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_lifecycle_check" CHECK (
    ("status" = 'PENDING' AND "patientId" IS NULL AND "appointmentId" IS NULL)
 OR ("status" = 'PATIENT_LINKED' AND "branchId" IS NOT NULL AND "patientId" IS NOT NULL AND "appointmentId" IS NULL)
 OR ("status" = 'BOOKED' AND "branchId" IS NOT NULL AND "patientId" IS NOT NULL AND "appointmentId" IS NOT NULL)
);

COMMIT;
