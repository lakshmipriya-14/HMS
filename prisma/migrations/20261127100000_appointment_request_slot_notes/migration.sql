-- AlterTable
ALTER TABLE "AppointmentRequest" ADD COLUMN IF NOT EXISTS "preferredTime" VARCHAR(16);
ALTER TABLE "AppointmentRequest" ADD COLUMN IF NOT EXISTS "notes" TEXT;
