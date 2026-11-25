import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { resolveOperationalScope, assertBranchAccess } from '../common/utils/operational-scope';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private where(actor: AuthUserDto, requestedBranchId?: string): Prisma.DepartmentWhereInput {
    const scope = resolveOperationalScope(actor, requestedBranchId);
    const hospital = { hospitalId: scope.hospitalId, deletedAt: null };
    if (actor.role === Role.SUPER_ADMIN) {
      if (scope.branchId) {
        return { ...hospital, branchId: scope.branchId };
      }
      return hospital;
    }
    if (actor.role === Role.HOSPITAL_ADMIN) {
      return { ...hospital, branchId: scope.branchId };
    }
    if (actor.role === Role.DEPARTMENT_ADMIN) {
      return { ...hospital, id: scope.departmentId, branchId: scope.branchId };
    }
    return { ...hospital, branchId: scope.branchId };
  }

  private include(actor: AuthUserDto, requestedBranchId?: string): Prisma.DepartmentInclude {
    const scope = resolveOperationalScope(actor, requestedBranchId);
    const doctorWhere: Prisma.DoctorWhereInput = { hospitalId: scope.hospitalId };
    const wardWhere: Prisma.WardWhereInput = { hospitalId: scope.hospitalId };
    if (scope.branchId) {
      doctorWhere.branchId = scope.branchId;
      wardWhere.branchId = scope.branchId;
    }
    return {
      doctors: {
        where: doctorWhere,
        include: { employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } }, qualifications: true },
      },
      wards: { where: wardWhere },
      userRoleScopes: {
        where: { role: { name: Role.DEPARTMENT_ADMIN } },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      },
    };
  }

  async findAll(actor: AuthUserDto, requestedBranchId?: string) {
    return this.prisma.department.findMany({
      where: this.where(actor, requestedBranchId),
      include: this.include(actor, requestedBranchId),
      orderBy: { name: 'asc' },
    });
  }

  async findOne(actor: AuthUserDto, id: string) {
    const department = await this.prisma.department.findFirst({
      where: { AND: [this.where(actor), { id }] },
      include: this.include(actor),
    });
    if (!department) throw new NotFoundException('Department not found.');
    return department;
  }

  async create(actor: AuthUserDto, dto: { name: string; code: string; description?: string; branchId?: string; headOfDepartmentId?: string }) {
    const scope = resolveOperationalScope(actor, dto.branchId);
    if (!scope.branchId) {
      throw new BadRequestException('Branch ID is required to create a department.');
    }
    assertBranchAccess(actor, scope.branchId);

    const existing = await this.prisma.department.findFirst({
      where: {
        hospitalId: scope.hospitalId,
        code: dto.code.toUpperCase().trim(),
        deletedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException(`Department code "${dto.code}" is already in use.`);
    }

    return this.prisma.department.create({
      data: {
        hospitalId: scope.hospitalId,
        branchId: scope.branchId,
        name: dto.name.trim(),
        code: dto.code.toUpperCase().trim(),
        description: dto.description?.trim() || null,
        headOfDepartmentId: dto.headOfDepartmentId || null,
      },
      include: this.include(actor, scope.branchId),
    });
  }

  async update(actor: AuthUserDto, id: string, dto: { name?: string; description?: string; headOfDepartmentId?: string }) {
    const department = await this.findOne(actor, id);
    if (department.branchId) {
      assertBranchAccess(actor, department.branchId);
    }

    return this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.headOfDepartmentId !== undefined ? { headOfDepartmentId: dto.headOfDepartmentId || null } : {}),
      },
      include: this.include(actor, department.branchId || undefined),
    });
  }

  async toggleStatus(actor: AuthUserDto, id: string) {
    const department = await this.findOne(actor, id);
    if (department.branchId) {
      assertBranchAccess(actor, department.branchId);
    }

    return this.prisma.department.update({
      where: { id },
      data: { isActive: !department.isActive },
      include: this.include(actor, department.branchId || undefined),
    });
  }

  async assignHod(actor: AuthUserDto, departmentId: string, doctorId: string | null) {
    const department = await this.findOne(actor, departmentId);
    if (department.branchId) {
      assertBranchAccess(actor, department.branchId);
    }

    if (doctorId) {
      const doctor = await this.prisma.doctor.findFirst({
        where: { id: doctorId, hospitalId: actor.hospitalId },
      });
      if (!doctor) {
        throw new NotFoundException('Doctor not found in this hospital.');
      }
    }

    return this.prisma.department.update({
      where: { id: departmentId },
      data: { headOfDepartmentId: doctorId },
      include: this.include(actor, department.branchId || undefined),
    });
  }

  /**
   * MANDATORY BUSINESS RULE:
   * 1. One department must have exactly ONE active Department Admin.
   * 2. Hospital Admin is responsible for assigning and replacing the Department Admin.
   * 3. A Department Admin account must belong to only one department.
   */
  async assignDepartmentAdmin(actor: AuthUserDto, departmentId: string, userId: string) {
    const scope = resolveOperationalScope(actor);
    const department = await this.findOne(actor, departmentId);
    if (!department.branchId) {
      throw new BadRequestException('Department must be associated with a branch.');
    }
    assertBranchAccess(actor, department.branchId);

    return this.prisma.$transaction(async (tx) => {
      // Find DEPARTMENT_ADMIN role definition
      const deptAdminRole = await tx.role.findFirst({
        where: { name: Role.DEPARTMENT_ADMIN },
      });
      if (!deptAdminRole) {
        throw new NotFoundException('DEPARTMENT_ADMIN role not found.');
      }

      // Check if target user exists in this hospital
      const user = await tx.user.findFirst({
        where: { id: userId, hospitalId: scope.hospitalId, deletedAt: null },
      });
      if (!user) {
        throw new NotFoundException('User not found.');
      }

      // Rule: Check if user is ALREADY Department Admin for ANY OTHER department
      const existingUserAssignment = await tx.userRole.findFirst({
        where: {
          hospitalId: scope.hospitalId,
          userId,
          roleId: deptAdminRole.id,
          departmentId: { not: departmentId },
        },
        include: { department: true },
      });
      if (existingUserAssignment) {
        throw new ConflictException(
          `User is already assigned as Department Admin for "${existingUserAssignment.department?.name || existingUserAssignment.departmentId}". A Department Admin account can only manage one department.`
        );
      }

      // Rule: One department must have exactly ONE active Department Admin.
      // Remove any existing Department Admin assignments for this department.
      await tx.userRole.deleteMany({
        where: {
          hospitalId: scope.hospitalId,
          departmentId,
          roleId: deptAdminRole.id,
        },
      });

      // Create new assignment
      const scopeKey = `branch:${department.branchId}:department:${department.id}`;
      const assignment = await tx.userRole.create({
        data: {
          hospitalId: scope.hospitalId,
          userId,
          roleId: deptAdminRole.id,
          branchId: department.branchId,
          departmentId: department.id,
          scopeKey,
        },
      });

      // Update employee record if exists
      await tx.employee.updateMany({
        where: { userId, hospitalId: scope.hospitalId },
        data: {
          branchId: department.branchId,
          departmentId: department.id,
          designation: 'Department Administrator',
        },
      });

      // Audit log entry
      await tx.auditLog.create({
        data: {
          hospitalId: scope.hospitalId,
          branchId: department.branchId,
          userId: actor.id,
          userEmail: actor.email,
          userRole: actor.role,
          action: 'ASSIGN_DEPARTMENT_ADMIN',
          resource: 'DEPARTMENT',
          resourceId: department.id,
          details: { assignedUserId: userId, departmentCode: department.code },
        },
      });

      return assignment;
    });
  }

  async getDepartmentStats(actor: AuthUserDto, departmentId: string) {
    const department = await this.findOne(actor, departmentId);
    const scope = resolveOperationalScope(actor, department.branchId || undefined);

    const [doctorCount, activePatients, appointmentsCount, wardsCount] = await Promise.all([
      this.prisma.doctor.count({
        where: { departmentId, hospitalId: scope.hospitalId },
      }),
      this.prisma.admission.count({
        where: {
          ward: { departmentId },
          status: 'ADMITTED',
          hospitalId: scope.hospitalId,
        },
      }),
      this.prisma.appointment.count({
        where: { departmentId, hospitalId: scope.hospitalId },
      }),
      this.prisma.ward.count({
        where: { departmentId, hospitalId: scope.hospitalId },
      }),
    ]);

    return {
      departmentId,
      name: department.name,
      code: department.code,
      isActive: department.isActive,
      doctorCount,
      activePatients,
      appointmentsCount,
      wardsCount,
    };
  }
}
