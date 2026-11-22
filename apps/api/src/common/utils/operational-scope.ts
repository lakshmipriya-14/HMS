import { ForbiddenException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';

export interface OperationalScope {
  hospitalId: string;
  branchId?: string;
  departmentId?: string;
}

/**
 * Resolves and validates the operational scope for an authenticated actor.
 *
 * Rules:
 * 1. actor.hospitalId is mandatory for all roles.
 * 2. SUPER_ADMIN:
 *    - Organization-wide access.
 *    - Can optionally filter by requestedBranchId and/or requestedDepartmentId.
 *    - If no filters provided, branchId and departmentId remain undefined.
 * 3. HOSPITAL_ADMIN:
 *    - Strictly scoped to actor.branchId.
 *    - actor.branchId MUST be present; otherwise throws ForbiddenException.
 *    - actor.departmentId MUST NOT be present; otherwise throws ForbiddenException.
 *    - If requestedBranchId is supplied and does NOT match actor.branchId, throws ForbiddenException.
 *    - Can optionally filter by requestedDepartmentId within their own branch.
 *    - Client parameters CANNOT widen scope or override branchId.
 * 4. DEPARTMENT_ADMIN:
 *    - Strictly scoped to actor.branchId AND actor.departmentId.
 *    - Both actor.branchId and actor.departmentId MUST be present; otherwise throws ForbiddenException.
 *    - If requestedBranchId is supplied and does NOT match actor.branchId, throws ForbiddenException.
 *    - If requestedDepartmentId is supplied and does NOT match actor.departmentId, throws ForbiddenException.
 *    - Client parameters CANNOT widen scope.
 * 5. Operational Staff (DOCTOR, NURSE, RECEPTIONIST, PHARMACIST, etc.):
 *    - Must have actor.branchId; otherwise throws ForbiddenException (fails closed).
 *    - If requestedBranchId is supplied and does NOT match actor.branchId, throws ForbiddenException.
 *    - If actor.departmentId is present:
 *      - If requestedDepartmentId is supplied and does not match, throws ForbiddenException.
 *      - departmentId is fixed to actor.departmentId.
 *    - If actor.departmentId is not present:
 *      - Can optionally filter by requestedDepartmentId.
 * 6. PATIENT:
 *    - Scoped to hospitalId only (individual records filtered by patientProfileId).
 */
export function resolveOperationalScope(
  actor: AuthUserDto,
  requestedBranchId?: string,
  requestedDepartmentId?: string,
): OperationalScope {
  if (!actor || !actor.hospitalId) {
    throw new ForbiddenException('Missing hospital scope.');
  }

  // 1. SUPER_ADMIN
  if (actor.role === Role.SUPER_ADMIN) {
    return {
      hospitalId: actor.hospitalId,
      branchId: requestedBranchId || undefined,
      departmentId: requestedDepartmentId || undefined,
    };
  }

  // 2. PATIENT
  if (actor.role === Role.PATIENT) {
    return {
      hospitalId: actor.hospitalId,
    };
  }

  // 3. HOSPITAL_ADMIN
  if (actor.role === Role.HOSPITAL_ADMIN) {
    if (!actor.branchId) {
      throw new ForbiddenException('Hospital Admin requires branch scope.');
    }
    if (actor.departmentId) {
      throw new ForbiddenException('Hospital Admin must not have department scope.');
    }
    if (requestedBranchId && requestedBranchId !== actor.branchId) {
      throw new ForbiddenException('Access denied to other branch records.');
    }
    return {
      hospitalId: actor.hospitalId,
      branchId: actor.branchId,
      departmentId: requestedDepartmentId || undefined,
    };
  }

  // 4. DEPARTMENT_ADMIN
  if (actor.role === Role.DEPARTMENT_ADMIN) {
    if (!actor.branchId || !actor.departmentId) {
      throw new ForbiddenException('Department Admin requires branch and department scope.');
    }
    if (requestedBranchId && requestedBranchId !== actor.branchId) {
      throw new ForbiddenException('Access denied to other branch records.');
    }
    if (requestedDepartmentId && requestedDepartmentId !== actor.departmentId) {
      throw new ForbiddenException('Access denied to other department records.');
    }
    return {
      hospitalId: actor.hospitalId,
      branchId: actor.branchId,
      departmentId: actor.departmentId,
    };
  }

  // 5. All other operational staff roles (FAIL-CLOSED)
  if (!actor.branchId) {
    throw new ForbiddenException('Operational staff requires branch scope.');
  }
  if (requestedBranchId && requestedBranchId !== actor.branchId) {
    throw new ForbiddenException('Access denied to other branch records.');
  }
  if (actor.departmentId) {
    if (requestedDepartmentId && requestedDepartmentId !== actor.departmentId) {
      throw new ForbiddenException('Access denied to other department records.');
    }
    return {
      hospitalId: actor.hospitalId,
      branchId: actor.branchId,
      departmentId: actor.departmentId,
    };
  }

  return {
    hospitalId: actor.hospitalId,
    branchId: actor.branchId,
    departmentId: requestedDepartmentId || undefined,
  };
}

/**
 * Asserts that an actor has permission to access a specific branch.
 * - SUPER_ADMIN can access any branch in their hospital.
 * - All other roles can ONLY access their own assigned branch.
 */
export function assertBranchAccess(actor: AuthUserDto, targetBranchId: string): void {
  if (!actor || !actor.hospitalId) {
    throw new ForbiddenException('Missing hospital scope.');
  }
  if (actor.role === Role.SUPER_ADMIN) {
    return;
  }
  if (!actor.branchId || actor.branchId !== targetBranchId) {
    throw new ForbiddenException('Access denied to other branch records.');
  }
}

/**
 * Asserts that an actor has permission to access a specific department.
 * - SUPER_ADMIN can access any department in their hospital.
 * - HOSPITAL_ADMIN can access any department in their assigned branch or global departments.
 * - DEPARTMENT_ADMIN can only access their assigned department.
 * - Other staff can access departments within their assigned branch.
 */
export function assertDepartmentAccess(
  actor: AuthUserDto,
  departmentBranchId: string | null | undefined,
  departmentId: string,
): void {
  if (!actor || !actor.hospitalId) {
    throw new ForbiddenException('Missing hospital scope.');
  }
  if (actor.role === Role.SUPER_ADMIN) {
    return;
  }
  if (actor.role === Role.DEPARTMENT_ADMIN) {
    if (!actor.branchId || !actor.departmentId) {
      throw new ForbiddenException('Department Admin requires branch and department scope.');
    }
  } else if (!actor.branchId) {
    throw new ForbiddenException('Operational staff requires branch scope.');
  }
  // Department must belong to actor's branch (null or undefined departmentBranchId cannot bypass)
  if (!departmentBranchId || departmentBranchId !== actor.branchId) {
    throw new ForbiddenException('Access denied to department of another branch.');
  }
  // If actor is department admin, verify departmentId matches
  if (actor.role === Role.DEPARTMENT_ADMIN && actor.departmentId !== departmentId) {
    throw new ForbiddenException('Access denied to another department.');
  }
}
