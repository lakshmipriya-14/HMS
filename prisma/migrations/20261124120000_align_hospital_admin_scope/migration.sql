BEGIN;

-- Match the branch-scoped Hospital Admin used by provisioning and login.
CREATE OR REPLACE FUNCTION public."uyirinai_check_user_role_scope"() RETURNS trigger
LANGUAGE plpgsql AS $uyirinai$
DECLARE v_role text; v_department_branch text; v_department_hospital uuid;
BEGIN
  SELECT "name" INTO v_role FROM "Role" WHERE "id" = NEW."roleId";
  IF v_role IS NULL THEN RAISE EXCEPTION 'Unknown role for UserRole'; END IF;

  IF v_role IN ('SUPER_ADMIN', 'PATIENT') THEN
    IF NEW."branchId" IS NOT NULL OR NEW."departmentId" IS NOT NULL THEN
      RAISE EXCEPTION 'This role requires null branch and department scope';
    END IF;
  ELSIF v_role = 'HOSPITAL_ADMIN' THEN
    IF NEW."branchId" IS NULL OR NEW."departmentId" IS NOT NULL THEN
      RAISE EXCEPTION 'Hospital Admin requires branch scope without a department';
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
    ELSIF v_role NOT IN ('SUPER_ADMIN','PATIENT')
       AND v_department_branch IS NOT NULL
       AND v_department_branch IS DISTINCT FROM NEW."branchId" THEN
      RAISE EXCEPTION 'Department scope must be global or match the assigned branch';
    END IF;
  END IF;
  RETURN NEW;
END;
$uyirinai$;

CREATE OR REPLACE FUNCTION public."uyirinai_guard_role_rename"() RETURNS trigger
LANGUAGE plpgsql AS $uyirinai$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public."UserRole" AS assignment
    WHERE assignment."roleId" = OLD."id"
      AND CASE
        WHEN NEW."name" IN ('SUPER_ADMIN', 'PATIENT') THEN
          assignment."branchId" IS NOT NULL OR assignment."departmentId" IS NOT NULL
        WHEN NEW."name" = 'HOSPITAL_ADMIN' THEN
          assignment."branchId" IS NULL OR assignment."departmentId" IS NOT NULL
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

COMMIT;
