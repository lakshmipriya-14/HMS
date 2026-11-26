BEGIN;

CREATE INDEX "Notification_userId_createdAt_id_idx" ON "Notification" ("userId", "createdAt", "id");

-- Each notification commits with its source record. Existing records are not replayed.
CREATE FUNCTION "uyirinai_notify_patient_portal"() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  patient_id TEXT;
  recipient TEXT;
  notice_type TEXT;
  notice_title TEXT;
  notice_message TEXT;
BEGIN
  IF TG_TABLE_NAME = 'Appointment' THEN
    patient_id := NEW."patientId";
    notice_type := 'APPOINTMENT';
    IF TG_OP = 'INSERT' THEN
      IF NEW."status" NOT IN ('SCHEDULED', 'CHECKED_IN') THEN RETURN NEW; END IF;
      notice_title := CASE WHEN NEW."type" = 'FOLLOW_UP' THEN 'Follow-up scheduled' ELSE 'Appointment confirmed' END;
    ELSIF NEW."status" = 'CANCELLED' AND OLD."status" IS DISTINCT FROM NEW."status" THEN
      notice_title := 'Appointment cancelled';
    ELSIF NEW."status" = 'SCHEDULED' AND
          (NEW."appointmentDate", NEW."appointmentTime") IS DISTINCT FROM (OLD."appointmentDate", OLD."appointmentTime") THEN
      notice_title := 'Appointment rescheduled';
    ELSE
      RETURN NEW;
    END IF;
    notice_message := 'Open Appointments to review booking ' || NEW."appointmentNumber" || '.';
  ELSIF TG_TABLE_NAME = 'LabOrder' THEN
    IF NEW."reportReleasedAt" IS NULL OR OLD."reportReleasedAt" IS NOT NULL OR NEW."status" <> 'COMPLETED' THEN RETURN NEW; END IF;
    patient_id := NEW."patientId";
    notice_type := 'LAB_RESULT';
    notice_title := 'Laboratory report available';
    notice_message := 'Open Medical Records to view the released laboratory report.';
  ELSIF TG_TABLE_NAME = 'RadiologyOrder' THEN
    IF NEW."reportReleasedAt" IS NULL OR OLD."reportReleasedAt" IS NOT NULL OR NEW."status" <> 'REPORT_RELEASED' THEN RETURN NEW; END IF;
    patient_id := NEW."patientId";
    notice_type := 'RADIOLOGY_RESULT';
    notice_title := 'Radiology report available';
    notice_message := 'Open Medical Records to view the released radiology report.';
  ELSIF TG_TABLE_NAME = 'Prescription' THEN
    patient_id := NEW."patientId";
    notice_type := 'PRESCRIPTION';
    notice_title := 'New prescription';
    notice_message := 'Open Medical Records to review your prescription.';
  ELSIF TG_TABLE_NAME = 'Invoice' THEN
    IF NEW."status" NOT IN ('PENDING', 'PARTIALLY_PAID') OR NEW."paidAmount" >= NEW."totalAmount" THEN RETURN NEW; END IF;
    patient_id := NEW."patientId";
    notice_type := 'BILLING';
    notice_title := 'New invoice';
    notice_message := 'Open Bills to review your outstanding invoice.';
  ELSIF TG_TABLE_NAME = 'Payment' THEN
    IF NEW."paymentStatus" <> 'SUCCESS' THEN RETURN NEW; END IF;
    IF TG_OP = 'UPDATE' AND OLD."paymentStatus" = 'SUCCESS' THEN RETURN NEW; END IF;
    SELECT i."patientId" INTO patient_id FROM "Invoice" i
    WHERE i."id" = NEW."invoiceId" AND i."hospitalId" = NEW."hospitalId";
    notice_type := 'PAYMENT';
    notice_title := 'Payment recorded';
    notice_message := 'Open Bills to review your payment history.';
  ELSIF TG_TABLE_NAME = 'Admission' THEN
    patient_id := NEW."patientId";
    notice_type := 'ADMISSION';
    IF TG_OP = 'INSERT' THEN
      IF NEW."status" <> 'ADMITTED' THEN RETURN NEW; END IF;
      notice_title := 'Admission recorded';
    ELSIF NEW."status" = 'DISCHARGED' AND OLD."status" IS DISTINCT FROM NEW."status" THEN
      notice_title := 'Discharge recorded';
    ELSIF NEW."status" IN ('ADMITTED', 'TRANSFERRED') AND
          (NEW."wardId", NEW."bedId") IS DISTINCT FROM (OLD."wardId", OLD."bedId") THEN
      notice_title := 'Ward or bed updated';
    ELSE
      RETURN NEW;
    END IF;
    notice_message := 'Open Medical Records to review your admission details.';
  END IF;

  SELECT p."userId" INTO recipient FROM "Patient" p
  JOIN "User" u ON u."id" = p."userId" AND u."hospitalId" = p."hospitalId"
  WHERE p."id" = patient_id AND p."hospitalId" = NEW."hospitalId"
    AND p."deletedAt" IS NULL AND u."deletedAt" IS NULL AND u."isActive";

  IF recipient IS NOT NULL THEN
    INSERT INTO "Notification" ("id", "userId", "hospitalId", "branchId", "type", "title", "message")
    VALUES (gen_random_uuid()::text, recipient, NEW."hospitalId", NEW."branchId", notice_type, notice_title, notice_message);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "Appointment_patient_notice" AFTER INSERT OR UPDATE OF "status", "appointmentDate", "appointmentTime"
  ON "Appointment" FOR EACH ROW EXECUTE FUNCTION "uyirinai_notify_patient_portal"();
CREATE TRIGGER "LabOrder_patient_notice" AFTER UPDATE OF "reportReleasedAt"
  ON "LabOrder" FOR EACH ROW EXECUTE FUNCTION "uyirinai_notify_patient_portal"();
CREATE TRIGGER "RadiologyOrder_patient_notice" AFTER UPDATE OF "reportReleasedAt"
  ON "RadiologyOrder" FOR EACH ROW EXECUTE FUNCTION "uyirinai_notify_patient_portal"();
CREATE TRIGGER "Prescription_patient_notice" AFTER INSERT
  ON "Prescription" FOR EACH ROW EXECUTE FUNCTION "uyirinai_notify_patient_portal"();
CREATE TRIGGER "Invoice_patient_notice" AFTER INSERT
  ON "Invoice" FOR EACH ROW EXECUTE FUNCTION "uyirinai_notify_patient_portal"();
CREATE TRIGGER "Payment_patient_notice" AFTER INSERT OR UPDATE OF "paymentStatus"
  ON "Payment" FOR EACH ROW EXECUTE FUNCTION "uyirinai_notify_patient_portal"();
CREATE TRIGGER "Admission_patient_notice" AFTER INSERT OR UPDATE OF "status", "bedId", "wardId"
  ON "Admission" FOR EACH ROW EXECUTE FUNCTION "uyirinai_notify_patient_portal"();

COMMIT;
