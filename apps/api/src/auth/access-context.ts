import { UnauthorizedException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { Prisma } from '@prisma/client';

const roles = new Set<string>(Object.values(Role));
const hospitalRoles = new Set<string>([Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN]);

export async function resolveAccess(db: Prisma.TransactionClient, userId: string): Promise<AuthUserDto> {
  const user = await db.user.findFirst({
    where: { id: userId, isActive: true, deletedAt: null, hospital: { code: 'UYIRINAI', isActive: true, deletedAt: null } },
    select: {
      id: true, email: true, firstName: true, lastName: true, hospitalId: true,
      patient: { select: { id: true, deletedAt: true } },
      employee: { select: { id: true, doctor: { select: { id: true, branchId: true, departmentId: true } },
        nursingProfile: { select: { id: true, branchId: true } } } },
      userRoles: { select: {
        hospitalId: true, roleId: true, branchId: true, departmentId: true,
        branch: { select: { isActive: true, deletedAt: true } },
        department: { select: { branchId: true, isActive: true, deletedAt: true } },
        role: { select: { name: true, rolePermissions: { select: { permission: { select: { resource: true, action: true } } } } } },
      } },
    },
  });
  if (!user || user.userRoles.length !== 1) throw new UnauthorizedException('No single active role assignment is available.');
  const [assignment] = user.userRoles;
  const role = assignment.role.name as Role;
  if (!roles.has(role) || assignment.hospitalId !== user.hospitalId) throw new UnauthorizedException('Invalid role assignment.');
  const { branchId, departmentId, branch, department } = assignment;
  if (hospitalRoles.has(role) || role === Role.PATIENT) {
    if (branchId || departmentId || (role === Role.PATIENT && (!user.patient || user.patient.deletedAt))) {
      throw new UnauthorizedException('Invalid role scope.');
    }
  } else if (!branchId || !branch?.isActive || branch.deletedAt
    || (departmentId && (!department?.isActive || department.deletedAt || (department.branchId && department.branchId !== branchId)))
    || (role === Role.DEPARTMENT_ADMIN && !departmentId)
    || (role === Role.DOCTOR && (user.employee?.doctor?.branchId !== branchId
      || (departmentId && user.employee?.doctor?.departmentId !== departmentId)))) {
    throw new UnauthorizedException('Invalid branch or department assignment.');
  }
  const defaults = assignment.role.rolePermissions.map(({ permission }) => `${permission.resource}:${permission.action}`);
  const policy = await db.hospitalRolePolicy.findUnique({
    where: { hospitalId_roleId: { hospitalId: user.hospitalId, roleId: assignment.roleId } }, select: { grants: true },
  });
  return {
    id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, hospitalId: user.hospitalId, role,
    permissions: policy ? defaults.filter(grant => policy.grants.includes(grant)) : defaults,
    branchId: branchId || undefined, departmentId: departmentId || undefined, employeeId: user.employee?.id,
    doctorProfileId: user.employee?.doctor?.id, patientProfileId: user.patient?.id, nurseProfileId: user.employee?.nursingProfile?.id,
  };
}
