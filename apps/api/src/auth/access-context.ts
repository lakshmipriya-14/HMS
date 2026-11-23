import { UnauthorizedException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { Prisma } from '@prisma/client';

const roles = new Set<string>(Object.values(Role));
const hospitalRoles = new Set<string>([Role.SUPER_ADMIN]);

export async function resolveAccess(db: Prisma.TransactionClient, userId: string): Promise<AuthUserDto> {
  const allowedHospitalCodes = ['UYIRINAI', 'AALAYAM'];
  if (process.env.HOSPITAL_CODE && !allowedHospitalCodes.includes(process.env.HOSPITAL_CODE)) {
    allowedHospitalCodes.push(process.env.HOSPITAL_CODE);
  }

  const userModel = (db as any).user;
  const user: any = await userModel.findFirst({
    where: {
      id: userId,
      isActive: true,
      deletedAt: null,
      hospital: { code: { in: allowedHospitalCodes }, isActive: true, deletedAt: null },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      hospitalId: true,
      patient: { select: { id: true, deletedAt: true } },
      employee: {
        select: {
          id: true,
          doctor: { select: { id: true, branchId: true, departmentId: true } },
          nursingProfile: { select: { id: true, branchId: true } },
        },
      },
      userRoles: {
        select: {
          hospitalId: true,
          roleId: true,
          branchId: true,
          departmentId: true,
          branch: { select: { isActive: true, deletedAt: true } },
          department: { select: { branchId: true, isActive: true, deletedAt: true } },
          role: {
            select: {
              name: true,
              rolePermissions: {
                select: {
                  permission: { select: { resource: true, action: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    const anyUser: any = await userModel.findFirst({
      where: { id: userId, isActive: true, deletedAt: null },
      select: { id: true, hospital: { select: { id: true, code: true, name: true } } },
    });
    if (anyUser) {
      throw new UnauthorizedException(
        `Hospital code mismatch: Account is registered under hospital code '${anyUser.hospital?.code}', but system expects: ${allowedHospitalCodes.join(', ')}.`
      );
    }
    throw new UnauthorizedException('User account not found or has been deactivated.');
  }

  const userRoles = user.userRoles || [];
  if (userRoles.length !== 1) {
    if (userRoles.length === 0) {
      throw new UnauthorizedException('No active role has been assigned to this account in the database.');
    }
    throw new UnauthorizedException(
      `Account has ${userRoles.length} role assignments. Exactly 1 active role assignment is required.`
    );
  }
  const [assignment] = userRoles;
  const role = assignment.role?.name as Role;
  if (!roles.has(role) || assignment.hospitalId !== user.hospitalId) {
    throw new UnauthorizedException('Invalid role assignment.');
  }

  const { branchId, departmentId, branch, department } = assignment;
  if (hospitalRoles.has(role) || role === Role.PATIENT) {
    if (branchId || departmentId || (role === Role.PATIENT && (!user.patient || user.patient.deletedAt))) {
      throw new UnauthorizedException('Invalid role scope.');
    }
  } else if (
    !branchId ||
    !branch?.isActive ||
    branch.deletedAt ||
    (departmentId && (!department?.isActive || department.deletedAt || department.branchId !== branchId)) ||
    (role === Role.HOSPITAL_ADMIN && departmentId) ||
    (role === Role.DEPARTMENT_ADMIN && (!departmentId || !department?.branchId || department.branchId !== branchId)) ||
    (role === Role.DOCTOR &&
      (user.employee?.doctor?.branchId !== branchId ||
        (departmentId && user.employee?.doctor?.departmentId !== departmentId)))
  ) {
    throw new UnauthorizedException('Invalid branch or department assignment.');
  }

  const defaults = assignment.role?.rolePermissions
    ? assignment.role.rolePermissions.map(({ permission }: any) => `${permission.resource}:${permission.action}`)
    : [];

  const policy = await (db as any).hospitalRolePolicy?.findUnique?.({
    where: { hospitalId_roleId: { hospitalId: user.hospitalId, roleId: assignment.roleId } },
    select: { grants: true },
  });

  const assignedRoles = userRoles.map((a: any) => a.role?.name as Role).filter(Boolean);

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    hospitalId: user.hospitalId,
    role,
    roles: assignedRoles.length > 0 ? assignedRoles : [role],
    permissions: policy?.grants ? defaults.filter((grant: string) => policy.grants.includes(grant)) : defaults,
    branchId: branchId || undefined,
    departmentId: departmentId || undefined,
    employeeId: user.employee?.id,
    doctorProfileId: user.employee?.doctor?.id,
    patientProfileId: user.patient?.id,
    nurseProfileId: user.employee?.nursingProfile?.id,
  };
}
