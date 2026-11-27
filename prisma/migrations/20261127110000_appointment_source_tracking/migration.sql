-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('ONLINE_PATIENT', 'RECEPTION_WALK_IN');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "source" "AppointmentSource" NOT NULL DEFAULT 'ONLINE_PATIENT';
