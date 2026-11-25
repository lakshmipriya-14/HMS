import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { resolveOperationalScope, assertBranchAccess } from '../common/utils/operational-scope';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private scope(actor: AuthUserDto, requestedBranchId?: string): Prisma.UserWhereInput {
    const scope = resolveOperationalScope(actor, requestedBranchId);
    const where: Prisma.UserWhereInput = { hospitalId: scope.hospitalId, deletedAt: null };
    if (actor.role === Role.SUPER_ADMIN) {
      if (scope.branchId) where.employee = { branchId: scope.branchId };
      return where;
    }
    if (scope.branchId) {
      where.employee = {
        branchId: scope.branchId,
        ...(scope.departmentId ? { departmentId: scope.departmentId } : {}),
      };
    }
    return where;
  }

  async findAll(actor: AuthUserDto, role?: string, search?: string, requestedBranchId?: string) {
    const where = this.scope(actor, requestedBranchId);
    const conditions: Prisma.UserWhereInput[] = [];

    if (search) {
      conditions.push({
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    if (role) {
      conditions.push({
        userRoles: {
          some: {
            role: { name: role },
          },
        },
      });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        userRoles: {
          select: {
            role: { select: { id: true, name: true } },
            department: { select: { id: true, name: true, code: true } },
            branch: { select: { id: true, name: true } },
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            designation: true,
            department: { select: { id: true, name: true, code: true } },
            branch: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      ...u,
      role: u.userRoles[0]?.role.name,
      department: u.employee?.department || u.userRoles[0]?.department,
    }));
  }

  async findOne(actor: AuthUserDto, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { AND: [this.scope(actor), { id }] },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true,
        userRoles: { include: { role: true, department: true, branch: true } },
        employee: {
          include: { department: true, doctor: true, nursingProfile: true, branch: true },
        },
        patient: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createStaff(
    actor: AuthUserDto,
    dto: {
      email: string;
      password?: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role: Role;
      branchId?: string;
      departmentId?: string;
      employeeCode?: string;
      designation?: string;
    }
  ) {
    // Security check: Only SUPER_ADMIN can create another SUPER_ADMIN
    if (dto.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Hospital Admin cannot provision Super Admin accounts.');
    }

    const scope = resolveOperationalScope(actor, dto.branchId);
    if (!scope.branchId) {
      throw new BadRequestException('Branch ID is required to create a staff user.');
    }
    assertBranchAccess(actor, scope.branchId);

    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findFirst({
      where: { email, hospitalId: scope.hospitalId },
    });
    if (existing) {
      throw new ConflictException(`User with email "${email}" already exists.`);
    }

    const roleRecord = await this.prisma.role.findFirst({
      where: { name: dto.role },
    });
    if (!roleRecord) {
      throw new NotFoundException(`Role "${dto.role}" does not exist.`);
    }

    const defaultPassword = dto.password || 'UyirinaiTeamDemo!24';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const employeeCode =
      dto.employeeCode ||
      `EMP-${Date.now().toString().slice(-6)}`;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          hospitalId: scope.hospitalId,
          email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: dto.phone?.trim() || '0000000000',
          isActive: true,
        },
      });

      const isDeptAdmin = dto.role === Role.DEPARTMENT_ADMIN;
      const isHospAdmin = dto.role === Role.HOSPITAL_ADMIN;
      const scopeKey = isDeptAdmin
        ? `branch:${scope.branchId}:department:${dto.departmentId}`
        : isHospAdmin
        ? `branch:${scope.branchId}`
        : `branch:${scope.branchId}${dto.departmentId ? `:department:${dto.departmentId}` : ''}`;

      await tx.userRole.create({
        data: {
          hospitalId: scope.hospitalId,
          userId: user.id,
          roleId: roleRecord.id,
          branchId: scope.branchId,
          departmentId: dto.departmentId || null,
          scopeKey,
        },
      });

      const employee = await tx.employee.create({
        data: {
          hospitalId: scope.hospitalId,
          userId: user.id,
          branchId: scope.branchId,
          departmentId: dto.departmentId || null,
          employeeCode,
          designation: dto.designation || dto.role.replace(/_/g, ' '),
          dateOfJoining: new Date(),
          status: 'ACTIVE',
        },
      });

      await tx.auditLog.create({
        data: {
          hospitalId: scope.hospitalId,
          branchId: scope.branchId,
          userId: actor.id,
          userEmail: actor.email,
          userRole: actor.role,
          action: 'CREATE_STAFF_USER',
          resource: 'USER',
          resourceId: user.id,
          details: { role: dto.role, employeeCode },
        },
      });

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: dto.role,
        employeeCode,
      };
    });
  }

  async updateUser(
    actor: AuthUserDto,
    id: string,
    dto: { firstName?: string; lastName?: string; phone?: string; designation?: string; departmentId?: string }
  ) {
    const user = await this.findOne(actor, id);
    if (user.employee?.branchId) {
      assertBranchAccess(actor, user.employee.branchId);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          ...(dto.firstName ? { firstName: dto.firstName.trim() } : {}),
          ...(dto.lastName ? { lastName: dto.lastName.trim() } : {}),
          ...(dto.phone ? { phone: dto.phone.trim() } : {}),
        },
      });

      if (user.employee && (dto.designation || dto.departmentId)) {
        await tx.employee.update({
          where: { id: user.employee.id },
          data: {
            ...(dto.designation ? { designation: dto.designation } : {}),
            ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId || null } : {}),
          },
        });
      }

      return updatedUser;
    });
  }

  async toggleStatus(actor: AuthUserDto, id: string) {
    const user = await this.findOne(actor, id);
    if (user.employee?.branchId) {
      assertBranchAccess(actor, user.employee.branchId);
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  }

  async resetPassword(actor: AuthUserDto, id: string, newPassword?: string) {
    const user = await this.findOne(actor, id);
    if (user.employee?.branchId) {
      assertBranchAccess(actor, user.employee.branchId);
    }

    const passwordToSet = newPassword || 'UyirinaiTeamDemo!24';
    const passwordHash = await bcrypt.hash(passwordToSet, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await this.prisma.auditLog.create({
      data: {
        hospitalId: actor.hospitalId,
        branchId: user.employee?.branchId || null,
        userId: actor.id,
        userEmail: actor.email,
        userRole: actor.role,
        action: 'PASSWORD_RESET',
        resource: 'USER',
        resourceId: id,
      },
    });

    return { message: 'Password has been reset successfully.' };
  }
}
