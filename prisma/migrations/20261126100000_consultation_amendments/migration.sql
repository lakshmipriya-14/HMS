BEGIN;

CREATE TABLE "ConsultationAmendment" (
  "id" TEXT NOT NULL,
  "consultationId" TEXT NOT NULL,
  "hospitalId" UUID NOT NULL,
  "branchId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsultationAmendment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConsultationAmendment_consultationId_hospitalId_branchId_fkey"
    FOREIGN KEY ("consultationId", "hospitalId", "branchId")
    REFERENCES "Consultation" ("id", "hospitalId", "branchId") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ConsultationAmendment_authorId_hospitalId_fkey"
    FOREIGN KEY ("authorId", "hospitalId") REFERENCES "User" ("id", "hospitalId") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ConsultationAmendment_consultationId_createdAt_idx"
  ON "ConsultationAmendment" ("consultationId", "createdAt");

CREATE TRIGGER "ConsultationAmendment_append_only_guard"
  BEFORE UPDATE OR DELETE ON "ConsultationAmendment"
  FOR EACH ROW EXECUTE FUNCTION "uyirinai_reject_audit_mutation"();

CREATE TRIGGER "ConsultationAmendment_truncate_guard"
  BEFORE TRUNCATE ON "ConsultationAmendment"
  FOR EACH STATEMENT EXECUTE FUNCTION "uyirinai_reject_audit_mutation"();

COMMIT;
