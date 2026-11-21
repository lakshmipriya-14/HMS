BEGIN;

-- Advance the Role row version without changing its values. Assignments and
-- renames then serialize on the same row, including under snapshot isolation.
CREATE FUNCTION public."uyirinai_serialize_user_role_scope"() RETURNS trigger
LANGUAGE plpgsql AS $uyirinai$
BEGIN
  UPDATE public."Role" SET "name" = "name" WHERE "id" = NEW."roleId";
  RETURN NEW;
END;
$uyirinai$;

CREATE TRIGGER "UserRole_role_scope_serialize"
  BEFORE INSERT OR UPDATE OF "hospitalId", "roleId", "branchId", "departmentId"
  ON public."UserRole" FOR EACH ROW
  EXECUTE FUNCTION public."uyirinai_serialize_user_role_scope"();

CREATE FUNCTION public."uyirinai_guard_role_rename"() RETURNS trigger
LANGUAGE plpgsql AS $uyirinai$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public."UserRole" AS assignment
    WHERE assignment."roleId" = OLD."id"
      AND CASE
        WHEN NEW."name" IN ('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PATIENT') THEN
          assignment."branchId" IS NOT NULL OR assignment."departmentId" IS NOT NULL
        WHEN NEW."name" = 'DEPARTMENT_ADMIN' THEN
          assignment."branchId" IS NULL OR assignment."departmentId" IS NULL
        ELSE assignment."branchId" IS NULL
      END
  ) THEN
    RAISE EXCEPTION 'Role rename would invalidate an existing assignment scope'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$uyirinai$;

CREATE TRIGGER "Role_rename_scope_guard"
  BEFORE UPDATE OF "name" ON public."Role" FOR EACH ROW
  WHEN (OLD."name" IS DISTINCT FROM NEW."name")
  EXECUTE FUNCTION public."uyirinai_guard_role_rename"();

-- Advance the LabOrder row version before the existing result validation.
-- Removing an ordered test writes the same row before checking its results.
CREATE FUNCTION public."uyirinai_serialize_lab_result_scope"() RETURNS trigger
LANGUAGE plpgsql AS $uyirinai$
BEGIN
  UPDATE public."LabOrder" SET "updatedAt" = "updatedAt"
    WHERE "id" = NEW."labOrderId";
  -- Reparenting a parameter is already guarded when results reference it.
  -- Advance its row version so that guard also sees concurrent result writes.
  UPDATE public."TestParameter" SET "labTestId" = "labTestId"
    WHERE "id" = NEW."parameterId";
  RETURN NEW;
END;
$uyirinai$;

CREATE TRIGGER "LabResult_order_item_serialize"
  BEFORE INSERT OR UPDATE OF "labOrderId", "parameterId"
  ON public."LabResult" FOR EACH ROW
  EXECUTE FUNCTION public."uyirinai_serialize_lab_result_scope"();

CREATE FUNCTION public."uyirinai_guard_lab_order_item_removal"() RETURNS trigger
LANGUAGE plpgsql AS $uyirinai$
BEGIN
  UPDATE public."LabOrder" SET "updatedAt" = "updatedAt"
    WHERE "id" = OLD."labOrderId";

  IF NOT EXISTS (
    SELECT 1 FROM public."LabOrderItem" AS item
    WHERE item."labOrderId" = OLD."labOrderId" AND item."labTestId" = OLD."labTestId"
  ) AND EXISTS (
    SELECT 1
    FROM public."LabResult" AS result
    JOIN public."TestParameter" AS parameter ON parameter."id" = result."parameterId"
    WHERE result."labOrderId" = OLD."labOrderId" AND parameter."labTestId" = OLD."labTestId"
  ) THEN
    RAISE EXCEPTION 'Cannot remove the last ordered test supporting an existing lab result'
      USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$uyirinai$;

CREATE TRIGGER "LabOrderItem_delete_result_guard"
  AFTER DELETE ON public."LabOrderItem" FOR EACH ROW
  EXECUTE FUNCTION public."uyirinai_guard_lab_order_item_removal"();

CREATE TRIGGER "LabOrderItem_update_result_guard"
  AFTER UPDATE ON public."LabOrderItem" FOR EACH ROW
  WHEN (OLD."labOrderId" IS DISTINCT FROM NEW."labOrderId"
    OR OLD."labTestId" IS DISTINCT FROM NEW."labTestId")
  EXECUTE FUNCTION public."uyirinai_guard_lab_order_item_removal"();

CREATE FUNCTION public."uyirinai_reject_protected_truncate"() RETURNS trigger
LANGUAGE plpgsql AS $uyirinai$
BEGIN
  RAISE EXCEPTION 'Cannot truncate protected table %.%', TG_TABLE_SCHEMA, TG_TABLE_NAME
    USING ERRCODE = '23514';
END;
$uyirinai$;

-- TRUNCATE skips row triggers and could orphan results without the item guard.
CREATE TRIGGER "LabOrderItem_truncate_result_guard"
  BEFORE TRUNCATE ON public."LabOrderItem" FOR EACH STATEMENT
  EXECUTE FUNCTION public."uyirinai_reject_protected_truncate"();

CREATE TRIGGER "InventoryMovement_truncate_guard"
  BEFORE TRUNCATE ON public."InventoryMovement" FOR EACH STATEMENT
  EXECUTE FUNCTION public."uyirinai_reject_protected_truncate"();

CREATE TRIGGER "AuditLog_truncate_guard"
  BEFORE TRUNCATE ON public."AuditLog" FOR EACH STATEMENT
  EXECUTE FUNCTION public."uyirinai_reject_protected_truncate"();

-- These triggers run before the existing branch validators. Advance the
-- Department row version so a branch move and a scoped write cannot both
-- validate against the same stale state. At READ COMMITTED the validator reads
-- after the wait; a conflicting older snapshot must retry the transaction.
CREATE FUNCTION public."uyirinai_serialize_department_scope"() RETURNS trigger
LANGUAGE plpgsql AS $uyirinai$
BEGIN
  IF NEW."departmentId" IS NOT NULL THEN
    UPDATE public."Department" SET "branchId" = "branchId"
      WHERE "id" = NEW."departmentId" AND "hospitalId" = NEW."hospitalId";
  END IF;
  RETURN NEW;
END;
$uyirinai$;

CREATE TRIGGER "A_department_scope_serialize"
  BEFORE INSERT OR UPDATE OF "departmentId", "hospitalId", "branchId"
  ON public."Doctor" FOR EACH ROW
  EXECUTE FUNCTION public."uyirinai_serialize_department_scope"();

CREATE TRIGGER "A_department_scope_serialize"
  BEFORE INSERT OR UPDATE OF "departmentId", "hospitalId", "branchId", "roleId"
  ON public."UserRole" FOR EACH ROW
  EXECUTE FUNCTION public."uyirinai_serialize_department_scope"();

CREATE TRIGGER "A_department_scope_serialize"
  BEFORE INSERT OR UPDATE OF "departmentId", "hospitalId", "branchId"
  ON public."Employee" FOR EACH ROW
  EXECUTE FUNCTION public."uyirinai_serialize_department_scope"();

CREATE TRIGGER "A_department_scope_serialize"
  BEFORE INSERT OR UPDATE OF "departmentId", "hospitalId", "branchId"
  ON public."Appointment" FOR EACH ROW
  EXECUTE FUNCTION public."uyirinai_serialize_department_scope"();

CREATE TRIGGER "A_department_scope_serialize"
  BEFORE INSERT OR UPDATE OF "departmentId", "hospitalId", "branchId"
  ON public."Ward" FOR EACH ROW
  EXECUTE FUNCTION public."uyirinai_serialize_department_scope"();

COMMIT;
