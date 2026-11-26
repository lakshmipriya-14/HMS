BEGIN;

CREATE INDEX "Appointment_scheduled_reminder_idx"
ON "Appointment" ("appointmentDate") WHERE "status" = 'SCHEDULED';

CREATE FUNCTION "uyirinai_enqueue_patient_reminders"() RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE inserted integer;
BEGIN
  INSERT INTO "Notification" ("id", "userId", "hospitalId", "branchId", "title", "message", "type")
  SELECT 'appointment-reminder-' || md5(a."id" || ':' || a."appointmentDate"::text || ':' || a."appointmentTime"),
         u."id", a."hospitalId", a."branchId",
         CASE WHEN a."type" = 'FOLLOW_UP' THEN 'Upcoming follow-up' ELSE 'Upcoming appointment' END,
         'Appointment ' || a."appointmentNumber" || ' is scheduled for ' ||
           a."appointmentDate"::text || ' at ' || a."appointmentTime" || ' (IST).',
         'APPOINTMENT_REMINDER'
  FROM "Appointment" a
  JOIN "Patient" p ON p."id" = a."patientId" AND p."hospitalId" = a."hospitalId"
  JOIN "User" u ON u."id" = p."userId" AND u."hospitalId" = p."hospitalId"
  WHERE a."status" = 'SCHEDULED' AND p."deletedAt" IS NULL AND u."deletedAt" IS NULL AND u."isActive"
    AND a."appointmentDate" BETWEEN (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
                                AND (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date + 1
    AND CASE WHEN a."appointmentTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
      ((a."appointmentDate" + a."appointmentTime"::time) AT TIME ZONE 'Asia/Kolkata')
      BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + interval '24 hours'
    ELSE false END
  ON CONFLICT ("id") DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;

COMMIT;
