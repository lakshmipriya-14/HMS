BEGIN;
ALTER TABLE "Appointment" ADD COLUMN "sourceConsultationId" TEXT;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_sourceConsultationId_hospitalId_branchId_fkey"
  FOREIGN KEY ("sourceConsultationId", "hospitalId", "branchId")
  REFERENCES "Consultation" ("id", "hospitalId", "branchId") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Appointment_sourceConsultationId_idx" ON "Appointment" ("sourceConsultationId");
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_sourceConsultation_followup_check"
  CHECK ("sourceConsultationId" IS NULL OR "type" = 'FOLLOW_UP');
CREATE FUNCTION "uyirinai_check_followup_consultation"() RETURNS trigger
LANGUAGE plpgsql AS $uyirinai$
BEGIN
  IF NEW."sourceConsultationId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "Consultation" c
    WHERE c."id" = NEW."sourceConsultationId" AND c."patientId" = NEW."patientId"
      AND c."doctorId" = NEW."doctorId" AND c."status" = 'COMPLETED'
  ) THEN
    RAISE EXCEPTION 'A linked follow-up must match the finalized consultation patient and doctor.';
  END IF;
  RETURN NEW;
END;
$uyirinai$;
CREATE TRIGGER "Appointment_followup_consultation_guard"
  BEFORE INSERT OR UPDATE OF "sourceConsultationId", "patientId", "doctorId" ON "Appointment"
  FOR EACH ROW EXECUTE FUNCTION "uyirinai_check_followup_consultation"();
COMMIT;
